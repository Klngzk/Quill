$(document).ready(() =>{
    if(selectedTab === "replies"){
        loadreplies()
    }else{
        loadPost();
    }
});

function loadPost(){
    $(document).ready(() =>{
        $.get("/api/posts", {postedBy:profileUserId, pinned:true},results =>{
            outputPinnedPost(results,$(".pinnedPostsContainer"));
        })
        $.get("/api/posts", {postedBy:profileUserId, isReply:false},results =>{
            outputPosts(results,$(".postsContainer"));
        })
    })
}

function loadreplies(){
    $(document).ready(() =>{
        $.get("/api/posts", {postedBy:profileUserId, isReply:true},results =>{
            outputPosts(results,$(".postsContainer"));
        })
    })
}