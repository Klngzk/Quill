const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const forumcontainer = document.querySelector(".forumcontainer");

sign_up_btn.addEventListener("click", () => {
  forumcontainer.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  forumcontainer.classList.remove("sign-up-mode");
});
