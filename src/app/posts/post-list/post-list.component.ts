import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';

import { Post } from '../post.model';
import { PostsService } from '../post.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})

export class PostListComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  private postsSub: Subscription;
  private authListenerSub: Subscription;
  userIsAuthenticated = false;
  isLoading = false;
  userId: string;
  totalPosts = 0;
  postsPerPage = 5;
  currentPage = 1;
  pageSizeOptions = [1, 2, 5, 10];
  // postsService: PostsService;
  // constructor(postsService: PostsService) {
  //   this.postsService = postsService;
  // }
  constructor(
    public postsService: PostsService,
    private authService: AuthService
  ) {} // Public simplifies code

  ngOnInit() {
    this.isLoading = true;
    this.postsService.getPosts(this.postsPerPage, 1); // This will update the getPostUpdateListener observable
    this.postsSub = this.postsService.getPostUpdateListener()
      .subscribe((postData: {posts: Post[], maxPosts: number}) => {
        this.isLoading = false;
        this.posts = postData.posts;
        this.totalPosts = postData.maxPosts;
    });
    this.userIsAuthenticated = this.authService.getIsAuth(); // Get current login status
    this.userId = this.authService.getUserId();
    // Since the post list component is loaded after logging in
    // so this block won't be entered again (no new broadcast)
    this.authListenerSub = this.authService.getAuthStatusListener().subscribe(
      isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      }
    );
  }

  onDelete(postId: string) {
    this.isLoading = true;
    this.postsService.deletePost(postId).subscribe(() => {
      this.postsService.getPosts(this.postsPerPage, this.currentPage); // refetch after deletion
    }, () => {
      this.isLoading = false;
    });
  }

  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.postsPerPage = pageData.pageSize;
    this.postsService.getPosts(this.postsPerPage, this.currentPage);
  }

  ngOnDestroy() {
    this.postsSub.unsubscribe();
    this.authListenerSub.unsubscribe();
  }
}
