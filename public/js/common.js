//Global
var cropper;
var timer;
var selectedUsers=[];

$(document).ready(() => {
    
    refreshMessagegsBadge();
    refreshNotificationsBadge();
})

$("#postTextarea, #replyTextarea").keyup(event =>{
    var textbox = $(event.target);
    var value = textbox.val().trim();
    var isModal = textbox.parents(".modal").length == 1;

    var submitButton = isModal ? $('#submitReplyButton') : $('#submitPostButton');
    if(submitButton.length == 0 ) return console.log('No submit button found')

    if(value == ""){
        submitButton.prop("disabled", true);
        return;
    }

    submitButton.prop("disabled", false);
})

$('#replyModal').on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);

    $("#submitReplyButton").data("id", postId);

    $.get("/api/posts/" + postId, results =>{
        outputPosts(results.postData,$("#originalPostContainer"));
    })
})

$('#replyModal').on("hidden.bs.modal", () => $("#originalPostContainer").html(""));

$('#deletePostModal').on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);

    $("#deletePostButton").data("id", postId);

})
$('#pinnedModal').on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);

    $("#pinnedButton").data("id", postId);

})
$('#unpinModal').on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);

    $("#unpinButton").data("id", postId);

})
$("#filePhoto").change(function() {
    if(this.files && this.files[0]){
        var reader = new FileReader();
        reader.onload = (e) =>{
            var image = document.getElementById("imagePreview");

            image.src=e.target.result;

            if(cropper !== undefined){
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 1 / 1,
                background: false
            })
        }
        reader.readAsDataURL(this.files[0]);
    }

})
$("#coverPhoto").change(function() {
    if(this.files && this.files[0]){
        var reader = new FileReader();
        reader.onload = (e) =>{
            var image = document.getElementById("coverImagePreview");

            image.src=e.target.result;

            if(cropper !== undefined){
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 16 / 9,
                background: false
            })
        }
        reader.readAsDataURL(this.files[0]);
    }

})
$("#imageUploadButton").click(() =>{
    var canvas = cropper.getCroppedCanvas();
    if(canvas == null) return console.log("error");

    canvas.toBlob((blob) =>{
        var formData = new FormData();
        formData.append("croppedImage",blob);

        $.ajax({
            url:"/api/users/profilePicture",
            type: "POST",
            data:formData,
            processData:false,
            contentType:false,
            success: () => location.reload()
        })
    }) 
})
$("#coverImageUploadButton").click(() =>{
    var canvas = cropper.getCroppedCanvas();
    if(canvas == null) return console.log("error");

    canvas.toBlob((blob) =>{
        var formData = new FormData();
        formData.append("croppedImage",blob);

        $.ajax({
            url:"/api/users/coverPicture",
            type: "POST",
            data:formData,
            processData:false,
            contentType:false,
            success: () => location.reload()
        })
    }) 
})
$("#deletePostButton").click((event) =>{
    var postId = $(event.target).data("id");

    $.ajax({
        url:`/api/posts/${postId}`,
        type:"DELETE",
        success: () => {
            location.reload()
        }
    })
})
$("#pinnedButton").click((event) =>{
    var postId = $(event.target).data("id");

    $.ajax({
        url:`/api/posts/${postId}`,
        type:"PUT",
        data:{pinned:true},
        success: () => {
            location.reload()
        }
    })
})
$("#unpinButton").click((event) =>{
    var postId = $(event.target).data("id");

    $.ajax({
        url:`/api/posts/${postId}`,
        type:"PUT",
        data:{pinned:false},
        success: () => {
            location.reload()
        }
    })
})
$("#createChatButton").click((event) =>{
    var data = JSON.stringify(selectedUsers)
    $.post("/api/chats",{users:data},chat =>{
        window.location.href = `/messages/${chat._id}`
    })
})


$("#userSearchBox").keydown((e) =>{
    clearTimeout(timer);
    var textbox = $(e.target);
    var value = textbox.val();

    if(value == "" && (e.which == 8 || e.keyCode == 8)){
        //remove users from selection
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("")
        if(selectedUsers.length == 0){
            $("#createChatButton").prop("disabled",false);
        }    
        return;

    }
    timer = setTimeout(() =>{
        value=textbox.val().trim()
        if(value == ""){
            $(".resultsContainer").html("")
        }
        else{
            searchUsers(value)
        }
    },1000)
})

$("#submitPostButton, #submitReplyButton").click(() =>{
    var button = $(event.target);
    var isModal = button.parents(".modal").length == 1;

    var textbox = isModal ? $("#replyTextarea") : $("#postTextarea");

    var data = {
        content: textbox.val()

    }
    if (isModal){
        var id = button.data().id;
        if(id == null) return console.log("Button id is null")
        data.replyTo = id;
    }
    $.post("/api/posts", data , postData =>{

        if(postData.replyTo){
            emitNotification(postData.replyTo.postedBy)
            location.reload();
            
        }else {
            var html = createPostHtml (postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true);
        }


    })
})

$(document).on("click",".likeButton", () => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);

    if(postId === undefined) return console.log("Post id undefined");

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) =>{
            button.find("span").text(postData.likes.length || "" );

            if(postData.likes.includes(userLoggedIn._id)){
                button.addClass("active");
                emitNotification(postData.postedBy)
            }
            else {
                button.removeClass("active")
            }
        }
    })


})

$(document).on("click",".shareButton", () => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);

    if(postId === undefined) return console.log("Post id undefined");

    $.ajax({
        url: `/api/posts/${postId}/share`,
        type: "POST",
        success: (postData) =>{
                console.log(postData);

            button.find("span").text(postData.shareUsers.length || "" );

            if(postData.shareUsers.includes(userLoggedIn._id)){
                button.addClass("active");
                emitNotification(postData.postedBy)
            }
            else {
                button.removeClass("active")
            }
        }
    })


})

$(document).on("click",".post", () => {
    var element = $(event.target);
    var postId = getPostIdFromElement(element);
    if(postId !== undefined && !element.is("button")){
      window.location.href = '/posts/' + postId;  
    }

})

$(document).on("click",".followButton", (e) =>{
    var button = $(e.target);
    var userId = button.data().user;
    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: "PUT",
        success: (data) =>{
            var difference = 1
            if(data.following && data.following.includes(userId)){
                button.addClass("following");
                button.text("Following")
                emitNotification(userId)
            }
            else {
                button.removeClass("following")
                button.text("Follow")
                difference = -1

            }

            var followerLabel = $("#followersValue")
            if(followerLabel.length != 0 ){
                var followersText = followerLabel.text();
                followersText = parseInt(followersText)
                followerLabel.text(followersText + difference)
            }
        }
    })

    
})
$(document).on("click",".notification.active", (e) => {
    var container = $(e.target);
    var notificationId = container.data().id

    var href= container.attr("href")
    e.preventDefault()
    var callback = () => window.location = href

    markedNotificationAsOpened(notificationId, callback)

})
function getPostIdFromElement(element){
    var isRoot = element.hasClass("post");
    var rootElement = isRoot == true ? element : element.closest(".post");
    var postId = rootElement.data().id;

    if(postId === undefined) return console.log("Post id undefined");

    return postId;
}

function createPostHtml(postData, largeFonts = false){
    if(postData == null) return console.log("post object is null");

    var isShare = postData.shareData !== undefined;
    var sharedBy = isShare? postData.postedBy.username : null;
    postData = isShare ? postData.shareData: postData;

    var largeFontsclass = largeFonts ? "largeFont" : ""
    var postedBy = postData.postedBy;
    var displayName = postedBy.firstName + " " + postedBy.lastName;
    var timestamp = timeDifference(new Date(), new Date(postData.createdAt));
    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";

    var shareButtonActiveClass = postData.shareUsers.includes(userLoggedIn._id) ? "active" : "";

    var shareText = '';
    if(isShare){
        shareText = `<span>
                    <i class='fas fa-retweet'> </i> 
                    Shared By <a href='/profile/${sharedBy}'>@${sharedBy}</a>
                    ` 
    }

    var replyFlag = "";
    if(postData.replyTo && postData.replyTo._id){
        var replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}' > @${replyToUsername} </a>
                    </div>

                    `;
    } 

    var pinnedClass=""
    var pinnedText=""
    var buttons = ""
    var dataTarget = "#pinnedModal"
    if(postData.postedBy._id == userLoggedIn._id){
        if(postData.pinned == true){
            dataTarget = "#unpinModal"
            pinnedClass = "active"
            pinnedText="<i class ='fas fa-thumbtack'></i> <span> Pinned Post </span>"
        }
        buttons = ` 
        <button class = 'pinnedButton ${pinnedClass}'data-id='${postData._id}' data-toggle='modal' data-target = ${dataTarget}> <i class='fas fa-thumbtack' > </i> </button> 
        <button data-id='${postData._id}' data-toggle='modal' data-target = '#deletePostModal'> <i class='fas fa-times' > </i> </button>               
                    `
    }
  
    return `<div class = 'post ${largeFontsclass}' data-id='${postData._id}'>
                <div class='postActionContainer'>
                    ${shareText}
                </div>
                <div class= 'mainContentContainer'>

                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>

                    <div class='postContentContainer'>
                        <div class='pinnedText'>${pinnedText}</div>
                        <div class='header'>
                            <a href= '/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                        </div>

                        <div class='postFooter'>
                            <div class='postButtonContainer'>
                                <button data-toggle='modal' data-target='#replyModal'>
                                    <i class='far fa-comment'> </i>
                                </button>
                            </div>

                            <div class='postButtonContainer green'>
                                <button class='shareButton ${shareButtonActiveClass}'>
                                    <i class='fas fa-retweet'> </i>
                                    <span> ${postData.shareUsers.length || "" } </span>
                                </button>
                            </div>

                            <div class='postButtonContainer red'>
                                <button class='likeButton ${likeButtonActiveClass}'>
                                    <i class='far fa-heart'> </i>
                                    <span> ${postData.likes.length || "" } </span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
                            
    `;
}

function getChatName(chatData){
    var chatName = chatData.chatName
    if(!chatName){
        var otherChatUsers = getOtherChatUsers(chatData.users)
        var namesArray = otherChatUsers.map(user => user.firstName+ " " + user.lastName)
        chatName= namesArray.join(", ") 
    }
    return chatName
}
function getOtherChatUsers(users){
    if(users.length == 1) return users;

    return users.filter(user => user._id != userLoggedIn._id)
}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 30) return "Just now";
        
        return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}
function outputPosts(results,container){
    container.html("");
    if(!Array.isArray(results)) results=[results];

    results.forEach(result => {
        var html = createPostHtml(result)
        container.append(html);
    });

    if (results.length == 0 ){
        container.append("<span class='noResults' >Nothing to show </span>");
    }
}
function outputPinnedPost(results,container){
    container.html("");
    if(results.length == 0){
        container.hide()
        return
    }
    results.forEach(result => {
        var html = createPostHtml(result)
        container.append(html);
    });

}

function outputPostsWithReplies(results,container){
    container.html("");

    if(results.replyTo !== undefined && results.replyTo._id !== undefined){
        var html = createPostHtml(results.replyTo)
        container.append(html);
    }
    
    var mainPosthtml = createPostHtml(results.postData, true)
    container.append(mainPosthtml)

    results.replies.forEach(result => {
        var html = createPostHtml(result)
        container.append(html);
    });

    if (results.length == 0 ){
        container.append("<span class='noResults' >Nothing to show </span>");
    }
}

function outputUsers(results,container){
    container.html("");
    results.forEach(result => {
        var html = createUserHtml(result,true)
        container.append(html)
    })
    if(results.length == 0) {
        container.append("<span class='noResults'>No results found </span>")
    }
}

function createUserHtml(userData,ShowFollowButton){
    var name = userData.firstName + " " + userData.lastName;

    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id)
    var text = isFollowing ? "Following" : "Follow"
    var buttonClass = isFollowing ? "followButton following" : "followButton"
    var followButton= ""
    if(ShowFollowButton && userLoggedIn._id != userData._id){
        followButton = `<div class='followButtonContainer'>
                            <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                        </div>
                        `
    }
    return  `   <div class ='user'>
                    <div class = 'userImageContainer'>
                        <img src='${userData.profilePic}'>
                    </div>
                    <div class='userDetailsContainer'>
                        <div class='header'>
                            <a href='/profile/${userData.username}'> ${name}</a>
                            <span class='username'> @${userData.username}</span>
                        </div>
                    </div>
                    ${followButton}
                </div>

            `
}
function searchUsers(searchTerm){
    $.get("/api/users",{search:searchTerm}, results =>{
        outputSelectedUsers(results,$(".resultsContainer"))
    })
}
function outputSelectedUsers(results,container){
    container.html("");
    results.forEach(result => {
        if(result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)){
            return;
        }
        var html = createUserHtml(result,false)
        var element= $(html);
        element.click(() => userSelected(result))
        container.append(element)
    })
    if(results.length == 0) {
        container.append("<span class='noResults'>No results found </span>")
    }
}
function userSelected(user){
    selectedUsers.push(user);
    updateSelectedUsersHtml()

    $("#userSearchBox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled",false)
}
function updateSelectedUsersHtml(){
    var elements = []
    selectedUsers.forEach(user =>{
        var name= user.firstName + " "+user.lastName;
        var userElement = $(`<span class='selectedUser'> ${name}</span>`)
        elements.push(userElement)
    })
    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements)
}

function messageReceived(newMessage){
    if($(`[data-room = "${newMessage.chat._id}"]`).length == 0){
        //show noti
        showMessagePopup(newMessage)

    }
    else{
        addChatMessageHtml(newMessage)
        refreshMessagegsBadge()
    }
    refreshMessagegsBadge()
}

function markedNotificationAsOpened(notificationId = null,callback=null){
    if(callback == null) callback = () => location.reload()

    var url = notificationId != null ? `/api/notifications/${notificationId}/marked` : `/api/notifications/marked`

    $.ajax({
        url: url,
        type:"PUT",
        success: () =>{
            callback()
        }
    })
}

function refreshMessagegsBadge(){
    $.get("/api/chats",{unreadOnly:true}, (data) =>{

        var numResults= 0

        data.forEach(d => {
            if(d.latestMessage.sender._id != userLoggedIn._id) numResults ++
        })
        

        console.log(numResults)
        
        // var numResults= data.length;
        if(numResults > 0){
            $("#messagesB").text(numResults).addClass("active")
        }
        else{
            $("#messagesB").text("").removeClass("active")
        }
    })
}
function refreshNotificationsBadge(){
    $.get("/api/notifications",{unreadOnly:true}, (data) =>{
        var numResults= data.length;
        if(numResults > 0){
            $("#notificationsB").text(numResults).addClass("active")
        }
        else{
            $("#notificationsB").text("").removeClass("active")
        }
    })
}

function showNotificationPopup(data){
    var html = createNotificationHtml(data)
    var element = $(html)
    element.hide().prependTo("#notificationList").slideDown("fast")

    setTimeout(() => element.fadeOut(400),5000)
}
function showMessagePopup(data){
    if(!data.chat.latestMessage._id){
        data.chat.latestMessage = data
    }
    var html = createChatHtml(data.chat)
    var element = $(html)
    element.hide().prependTo("#notificationList").slideDown("fast")

    setTimeout(() => element.fadeOut(400),5000)
}

function outputNotificationList(notifications,container){
    notifications.forEach(notification => {
        var html = createNotificationHtml(notification);
        container.append(html)
    })
    if(notifications.length == 0){
        container.append("<span class = 'noResults'> Nothing to Show.</span>")
    }
}

function createNotificationHtml(notification){
    var text = getNotificationText(notification)
    var userFrom = notification.userFrom
    var url =getNotificationUrl(notification)
    var className = notification.opened ? "" : "active"
    return `<a href='${url}' class='resultListItem notification ${className}' data-id='${notification._id}'>
                <div class='resultsImageContainer'>
                    <img src='${userFrom.profilePic}'>
                </div>
                <div class='resultsDetailsContainer ellipsis'>
                    <span class='ellipsis'> ${text} </span>
                </div>
            </a>
            `
}

function getNotificationText(notification){
    var userFrom = notification.userFrom; 
    if(!userFrom.firstName || !userFrom.lastName){
        return console.log("user not poopulate")
    }

    var userFromName = `${userFrom.firstName} ${userFrom.lastName} `
    var text;

    if(notification.notificationType == "share"){
        text = `${userFromName} shared one of your posts`
    }
    else if(notification.notificationType == "postLike"){
        text = `${userFromName} liked one of your posts`
    }
    else if(notification.notificationType == "reply"){
        text = `${userFromName} replied one of your posts`
    }
    else if(notification.notificationType == "follow"){
        text = `${userFromName} followed one of your posts`
    }

    return `<span class = 'ellipsis'>${text} </span>`
}

function getNotificationUrl(notification){

    var url="#";


    if( notification.notificationType == "share" ||
        notification.notificationType == "postLike" ||
        notification.notificationType == "reply"){
        url = `/posts/${notification.entityId}`
    }
    else if(notification.notificationType == "follow"){
        url = `/profile/${notification.userFrom.username}`
    }

    return url
}
function createChatHtml(chatData){
    var chatName = getChatName(chatData)
    var image= getChatImageElement(chatData)
    var latestMessage = getLatestMessage(chatData.latestMessage)

    var activeClass = chatData.latestMessage.sender._id == userLoggedIn._id ||!chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active"
    return `<a href='/messages/${chatData._id}' class='resultListItem ${activeClass}'>
                ${image}
                <div class='resultsDetailsContainer ellipsis'>
                    <span class='heading ellipsis'>${chatName}</span>
                    <span class='subText ellipsis'>${latestMessage}</span>
                </div>
            </a>
            `
}

function getLatestMessage(latestMessage){
    if(latestMessage != null){
        var sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }
    return "New Chat"
}

function getChatImageElement(chatData){
    var otherChatUsers = getOtherChatUsers(chatData.users)
    var groupChatClass="";
    var chatImage= getUserChatImageElement(otherChatUsers[0])

    if(otherChatUsers.length > 1){
        groupChatClass = "groupChatImage"
        chatImage+= getUserChatImageElement(otherChatUsers[1])
    }

    return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`
}

function getUserChatImageElement(user){
    if(!user || !user.profilePic){
        return console.log("userpassed into funciton invalid")
    }

    return `<img src='${user.profilePic}'>`
}

