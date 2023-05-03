import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Action } from 'src/app/interfaces/editor-launcher-data';
import { EditorService } from 'src/app/services/editor.service';
import { JwtService } from 'src/app/services/jwt.service';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss']
})
export class NavigationMenuComponent implements OnInit, OnDestroy {


  menuItems: MenuItem[] = [];
  buttonVisible = true;
  menuVisible = false;
  notifications = '';

  navigationSubscription: Subscription;


  constructor(
    private editorService: EditorService,
    private router: Router,
    private jwtService: JwtService,
    private activatedRoute: ActivatedRoute,
    private notificationsService: NotificationsService
  ) {
    this.navigationSubscription = this.router.events.subscribe(async (ev) => {
      if( ev instanceof NavigationEnd) {
        this.checkMenu(ev);
        this.updateNotifications(ev.url)
      }
    });
  }


  async ngOnInit(): Promise<void> {

    this.notifications = await this.notificationsService.getUnseenNotifications()


    this.checkMenu({
      url: `/${this.activatedRoute.snapshot.url.toString()}`,
      urlAfterRedirects: '',
      id: -1,
      type: 1
    })

  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  showMenu() {
    this.menuVisible = true;
  }

  hideMenu() {
    this.menuVisible = false;
    this.editorService.launchPostEditorEmitter.next({action: Action.Close});
  }


  checkMenu(ev: NavigationEnd) {

    if(this.jwtService.tokenValid()) {

      this.menuItems = [
        {
          label: 'Dashboard',
          title: 'View dashboard',
          icon: "pi pi-home",
          command: () => this.hideMenu(),
          routerLink: '/dashboard'
        },
        {
          label: 'Write new post',
          title: 'Write a post',
          icon: "pi pi-pencil",
          command: () => {this.editorService.launchPostEditorEmitter.next({action: Action.New}); this.menuVisible = false;}
        },
        {
          label: 'Notifications',
          icon: "pi pi-bell",
          title: 'Check your notifications',
          command: () => this.hideMenu(),
          routerLink: '/dashboard/notifications',
          badge: this.notifications
        },
        {
          label: 'Local explore',
          icon: "pi pi-server",
          title: 'See the local posts of the server!',
          command: () => this.hideMenu(),
          routerLink: '/dashboard/exploreLocal'
        },
        {
          label: 'Explore',
          icon: "pi pi-compass",
          title: 'See ALL the posts that are public! not only the ones of people you follow!',
          command: () => this.hideMenu(),
          routerLink: '/dashboard/explore'
        },
        {
          label: 'Private messages',
          icon: "pi pi-envelope",
          title: 'Private messages are here!',
          command: () => this.hideMenu(),
          routerLink: '/dashboard/private'
        },
        {
          label: 'Search',
          title: 'Search',
          icon: "pi pi-search",
          command: () => this.hideMenu(),
          routerLink: '/dashboard/search'
        },
        {
          label: 'My blog',
          title: 'View your own blog',
          icon: "pi pi-user",
          command: () => this.hideMenu(),
          routerLink: ['/blog', this.jwtService.getTokenData()['url']]
        },
        {
          label: 'Edit profile',
          title: 'Edit profile',
          icon: "pi pi-cog",
          command: () => this.hideMenu(),
          routerLink: ['/editProfile']
        },
        {
          label: 'Privacy policy',
          title: 'Privacy policy',
          icon: "pi pi-eye-slash",
          command: () => this.hideMenu(),
          routerLink: '/privacy'
        },
        {
          label: 'Check the source code!',
          icon: "pi pi-code",
          title: 'The frontend is made in angular, you can check the code here',
          target: "_blank",
          url: "https://github.com/gabboman/wafrn"
        },
        {
          label: "Give us some money",
          title: "Give us some money through patreon",
          icon: 'pi pi-euro',
          target: "_blank",
          url: "https://patreon.com/wafrn"
        },
        {
          label: 'Log out',
          icon: 'pi pi-sign-out',
          title: 'nintendo this button is for you, and your 25000000 alt accounts',
          command: () => {localStorage.clear(); this.router.navigate(['/']); this.hideMenu();}
        }
      ];

    } else {
      this.menuItems = [
        {
          label: 'Log in',
          title: 'Log in',
          icon: "pi pi-home",
          command: () => this.hideMenu(),
          routerLink: '/'
        },
        {
          label: 'Register',
          title: 'Register',
          icon: "pi pi-user",
          command: () => this.hideMenu(),
          routerLink: '/register'
        },
        {
          label: 'Explore without an account',
          icon: "pi pi-compass",
          title: 'See ALL the posts that are public! Yes, you can be a lurker',
          command: () => this.hideMenu(),
          routerLink: '/dashboard/exploreLocal'
        },
        {
          label: 'Search a blog!',
          title: 'Search',
          icon: "pi pi-search",
          command: () => this.hideMenu(),
          routerLink: '/dashboard/search'
        },
        {
          label: 'Privacy policy',
          title: 'Privacy policy',
          icon: "pi pi-eye-slash",
          command: () => this.hideMenu(),
          routerLink: '/privacy'
        },
        {
          label: 'Check the source code!',
          title: 'The frontend is made in angular, you can check the code here',
          icon: "pi pi-code",
          target: "_blank",
          url: "https://github.com/gabboman/wafrn"
        },
        {
          label: "Give us some money",
          title: "Give us some money through patreon",
          icon: 'pi pi-euro',
          target: "_blank",
          url: "https://patreon.com/wafrn"
        }
      ];
    }
  }

  updateNotifications(url: string) {
    if(this.jwtService.tokenValid()) {
      if(url === '/dashboard/notifications') {

      } else {
        this.notifications = '';
        this.menuItems[2].badge = ''
      }
      this.notificationsService.getUnseenNotifications().then(response => {
        this.notifications =  response
        this.menuItems[2].badge = response
      })

    }
  }

}
