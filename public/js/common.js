//preloader 
window.onload = function(){
  //hide the preloader
  const loader=document.querySelector(".preloader");
  loader.style.display = "none";
}

//password reissue popup
$('.password-code').click(function(){
  $('#generated-password').val(randomCode());
});

//password show/hide
//eye icon toggle
$(document).on('click','.eyeIcon',function(){
  var src=$(this).attr('src');
  if(src=='img/eye-off.png'){
    $(this).attr('src','img/eye-on.png');
    $(this).parents().siblings('input').attr('type','text');
  }else{
    $(this).attr('src','img/eye-off.png');
    $(this).parents().siblings('input').attr('type','password');
  }
});