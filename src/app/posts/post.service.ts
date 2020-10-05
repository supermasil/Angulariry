import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { Post } from './post.model';
import { Router } from '@angular/router'; // For navigation
import { environment } from 'src/environments/environment';

const BACKEND_URL = environment.apiURL + "/posts/"

@Injectable({providedIn: 'root'}) // Or add PostService to providers in app.module
export class PostsService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{posts: Post[], maxPosts: number}>(); // Like an event emitter

  constructor(private httpClient: HttpClient, private router: Router) {}

  getPosts(postsPerPage: number, currentPage:number) {
    const queryParams = `?pageSize=${postsPerPage}&currentPage=${currentPage}`;
    // return [...this.posts]; // ... pulls out the content to make a copy
    this.httpClient
      .get<{message: string, posts: any, maxPosts: number}>(BACKEND_URL + queryParams)
      .pipe(map((postData) => {
        return {posts: postData.posts.map(post => {
            return {
            title: post.title,
            content: post.content,
            id: post._id,
            imagePath: post.imagePath,
            creator: post.creator
            }
          }),
          maxPosts: postData.maxPosts};
        })
      )
      .subscribe((transformedPosts) => {
        this.posts = transformedPosts.posts;
        this.postsUpdated.next({
          posts: [...this.posts],
          maxPosts: transformedPosts.maxPosts
        });
    });
  }

  getPost(postId: String) {
    return this.httpClient.get<{
      _id: string,
      title: string,
      content: string,
      imagePath: string,
      creator: string}>(BACKEND_URL + postId); // return an observable
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  addPost(title: string, content: string, image: File) {
    // const post: Post = {id: null, title: title, content: content};
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);
    this.httpClient
      .post<{message: string, post: Post}>(BACKEND_URL, postData)
      .subscribe((responseData) => {
        const post: Post = {
          id: responseData.post.id,
          title: responseData.post.title,
          content: responseData.post.content,
          imagePath: responseData.post.imagePath,
          creator: responseData.post.creator
        };
        console.log(responseData.message);
        this.posts.push(post);
        this.router.navigate(['/']); // Will reload, no need to emit
    });

  }

  deletePost(postId: string) {
    return this.httpClient.delete(BACKEND_URL + postId);
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let postData: Post | FormData;
    if (typeof(image) === 'object') {
      postData = new FormData();
      postData.append('id', id);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('image', image, title);
    } else {
      postData = {
        id: id,
        title: title,
        content: content,
        imagePath: image,
        creator: null // Get creator id from auth service to be safe
      }
    }

    this.httpClient.put<{message: string, updatedPost: Post}>(BACKEND_URL + id, postData)
      .subscribe(response => {
        const updatedPosts = [...this.posts]; // create a copy
        const oldPostIndex = updatedPosts.findIndex(p => p.id === id);
        const post: Post = {
          id: response.updatedPost.id,
          title: response.updatedPost.title,
          content: response.updatedPost.content,
          imagePath: response.updatedPost.imagePath,
          creator: response.updatedPost.creator
        }
        updatedPosts[oldPostIndex] = post;
        this.posts = updatedPosts;
        this.router.navigate(['/']); // Will reload, no need to emit
      });
  }

}
