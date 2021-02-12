document.addEventListener("DOMContentLoaded", function(event) {
  let searchParams = new URLSearchParams(window.location.search);
  let token = searchParams.get('client');
  let team = searchParams.get('team');
 
  document.getElementById("token").value = token;
  document.getElementById("team").value = team;
});

$(document).ready(function(){

  $('form').on('submit', (e) => {
    e.preventDefault();
    $(".error-show").addClass("hidden");
    var errorMsg = "";

    const username = $('#username').val().trim();
    const password = $('#password').val().trim();
    const token = $('#token').val().trim();
    const team = $('#team').val().trim();
    if(username == ''){
    errorMsg = "メールアドレスを正しく入力してください"
    $(".error-message").text(errorMsg);
    }else{
    $(".error-message").text(errorMsg);
    }

    if(password == ''){
    errorMsg = "パスワードを正しく入力してください"
    $(".error-message").text(errorMsg);
    }else{
    $(".error-message").text(errorMsg);
    }

    if(username == '' && password == ''){
    errorMsg = "メールアドレスまたはパスワードが間違っています"
    $(".error-message").text(errorMsg);
    }else{
    $(".error-message").text(errorMsg);
    }

    if (errorMsg == "") {
    const data = {
        username,
        password,
        token,
        team
    };

    console.log(data);

    $.post('/tokenverify', data, function(response) {
        console.log(response.message);
        if(response.message != 'error'){
        window.location.href = response.message;
        }
        
    })
    .fail(function(response) {
            console.log('Error: ' + response);
    });
    }else {
    console.log("more required");
    }  
     
  });
  
});