import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Follower } from '../interfaces/follower';
import { Reblog } from '../interfaces/reblog';
import { JwtService } from './jwt.service';
import { firstValueFrom } from 'rxjs';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { basicPost } from '../interfaces/unlinked-posts';
import { UserNotifications } from '../interfaces/user-notifications';
import { NotificationType } from '../enums/notification-type';
import { ProcessedPost } from '../interfaces/processed-post';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  //lastTimeChecked: Date = new Date();
  notificationsScrollTime: Date = new Date();
  constructor(private http: HttpClient, private jwt: JwtService) { }

  async getUnseenNotifications(): Promise<{
    notifications: number;
    reports: number;
    awaitingAproval: number;
  }> {
    let res = {
      notifications: 0,
      reports: 0,
      awaitingAproval: 0,
    };
    try {
      const lastTimeCheckedString = localStorage.getItem(
        'lastTimeCheckNotifications'
      );
      const lastTimeChecked = lastTimeCheckedString
        ? new Date(lastTimeCheckedString)
        : new Date(1);
      let petitionData: HttpParams = new HttpParams();
      petitionData = petitionData.set(
        'startScroll',
        lastTimeChecked.getTime().toString()
      );
      const notifications = await firstValueFrom(
        this.http.get<{
          notifications: number;
          reports: number;
          awaitingAproval: number;
        }>(`${environment.baseUrl}/v2/notificationsCount`, {
          params: petitionData,
        })
      );
      res = notifications ? notifications : res;
    } catch (error) {
      console.warn('error processing notifications');
    }

    return res;
  }

  async getNotificationsScroll(
    page: number,
    resetDate = true
  ): Promise<{
    follows: Follower[];
    reblogs: Reblog[];
    mentions: Reblog[];
    likes: Reblog[];
    emojiReactions: UserNotifications[];
  }> {
    if (!this.jwt.tokenValid()) {
      return {
        follows: [],
        reblogs: [],
        mentions: [],
        likes: [],
        emojiReactions: [],
      };
    }
    let dateToCheck = this.notificationsScrollTime;
    if (page === 0) {
      if (resetDate && this.notificationsScrollTime) {
        this.notificationsScrollTime = new Date();
        dateToCheck = this.notificationsScrollTime;
      } else {
        dateToCheck = new Date();
      }
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set(
      'startScroll',
      dateToCheck.getTime().toString()
    );
    const tmp = await firstValueFrom(
      this.http.get<{
        users: SimplifiedUser[],
        posts: basicPost[],
        medias: any[],
        follows: any[],
        reblogs: any[],
        mentions: any[],
        likes: any[],
        emojiReactions: any[],
      }>(`${environment.baseUrl}/v2/notificationsScroll`, {
        params: petitionData,
      })
    );
    if (tmp) {
      tmp.posts = tmp.posts.map((post: any) => {
        let user = tmp.users.find(usr => usr.id === post.userId) as SimplifiedUser;
        post.user = user;
        const medias = tmp.medias.filter(med => med.posts[0].id === post.id)
        post.medias = medias;
        return post;
      })
      tmp.follows = tmp.follows.map((follow) => {
        const usr = tmp.users.find(usr => usr.id === follow.followerId)
        return {
          createdAt: new Date(follow.createdAt),
          url: usr?.url,
          avatar: usr?.avatar,
        };
      });
      tmp.emojiReactions = tmp.emojiReactions.map((emojiReact: any) => {
        const user = tmp.users.find((usr) => usr.id === emojiReact.userId);
        const post = tmp.posts.find(post => post.id === emojiReact.postId);
        return {
          date: new Date(emojiReact.createdAt),
          url: emojiReact.postId,
          userUrl: user?.url,
          avatar:
            environment.externalCacheurl +
            encodeURIComponent(
              user?.url.startsWith('@')
                ? user.avatar
                : environment.baseMediaUrl + user?.avatar
            ),
          type: NotificationType.EMOJIREACT,
          emojiReact: emojiReact.emoji,
          emojiName: emojiReact.content,
          fragment: post,

        };
      });
      tmp.likes = tmp.likes.map((like) => {
        const usr = tmp.users.find(usr => usr.id === like.userId)
        return {
          user: usr,
          content: tmp.posts.find(post => post.id === like.postId),
          id: like.postId,
          createdAt: new Date(like.createdAt),
        };
      });
      tmp.mentions = tmp.mentions.map((mention) => {
        if (!tmp.users.find((usr) => usr.id === mention.userId)) {
          console.log('USER MISSING: ' + mention.userId + ',' + mention.id);
        }
        const content = tmp.posts.find(post => post.id === mention.id)
        return {
          user: tmp.users.find((usr) => usr.id === mention.userId),
          content: content,
          id: mention.id,
          createdAt: new Date(mention.createdAt),
        };
      });
      tmp.reblogs = tmp.reblogs.map((reblog) => {
        const usr = tmp.users.find((usr) => usr.id === reblog.userId);
        return {
          user: usr,
          content: tmp.posts.find(post => post.id === reblog.parentId),
          id: reblog.id,
          createdAt: new Date(reblog.createdAt),
        };
      });
    }
    return tmp
      ? tmp
      : {
        follows: [],
        reblogs: [],
        mentions: [],
        likes: [],
        emojiReactions: [],
      };
  }
}
