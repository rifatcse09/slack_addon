document.addEventListener("DOMContentLoaded", function(event) {
  let searchParams = new URLSearchParams(window.location.search);
  let token = searchParams.get('client');
  let team = searchParams.get('team');
 
  document.getElementById("token").value = token;
  document.getElementById("team").value = team;
});

$(document).ready(function(){

  // input validation
  $('#form-login').on('input' , function() {
    var email = $("#username").val();
    var password = $("#password").val();

    if((isValidEmailAddress(email) && (email != 0)) && (password != 0)){
      $('.btn.btn-login').prop("disabled", false);
    }else{
      $('.btn.btn-login').prop("disabled", true);
    }
  });

  // email validation
  function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
  }

  // form submit and validation
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

    $.post('/slack/tokenverify', data, function(response) {
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