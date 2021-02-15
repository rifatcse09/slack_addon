const {App, ExpressReceiver, LogLevel} = require('@slack/bolt');
const axios = require('axios');
const crypto = require('crypto');
const mysql = require('mysql');
const path = require("path");
const express = require("express");
const qs = require('qs');
const dotenv = require('dotenv');
dotenv.config();


const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET,endpoints: "/slack/events" });

var con = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});



const installations = [
    {
        teamId: '', // get's from oauth
        botUserId: '', // get's from oauth
        botToken: '', // get's from oauth
        botId: '' // get's from users.info with BOT_USER_ID
        // teamId: 'T01E1PWMJVD', // get's from oauth
        // botToken: 'xoxb-1477812732999-1530308080512-eSTywkphZRyuu2IXZgXupF5L',
        // botId: 'B01EWKS9PQB',
        // botUserId: 'U01FL922CF2'
    }
];


const authorizeFn = async ({ teamId, enterpriseId }) => {
  // Fetch team info from database
  
    for (const team of installations) {
      console.log('team = ', team);
      // Check for matching teamId and enterpriseId in the installations array
      if ((team.teamId === teamId)) {
          // This is a match. Use these installation credentials.
          return {
              // You could also set userToken instead
              botToken: team.botToken,
              botId: team.botId,
              botUserId: team.botUserId
          };
      }

    }
 
  throw new Error('No matching authorizations');
};


const app = new App({
  receiver: receiver,
  authorize: authorizeFn,
  scopes: ['chat:write', 'chat:write:bot', 'im:write', 'commands', 'incoming-webhook','groups:read','mpim:read','im:read',
  'users:read', 'users:read.email', 'bot', 'conversations:read','conversations:history','channels:read','channels:write','conversations:write'],
  // LogLevel can be imported and used to make debugging simpler
  logLevel: LogLevel.DEBUG
});

// oauth handler
receiver.app.get('/oauth_redirect', async (req, res) => {
    let data = await app.client.oauth.v2.access({
        client_id: process.env.SLACK_CLIENT_ID ,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: req.query.code,
    });
    if (data.ok) {
        let authData = {teamId: data.team_id, botUserId: data.bot_user_id, botToken: data.access_token}
       
        try {
          // Call the users.info method using the built-in WebClient
          // The client uses the token you used to initialize the app
          let userData = await app.client.users.info({
            token: authData.botToken,
            user: authData.botUserId, 
          });
          
          if (userData.ok) {
              authData.botId = userData.user.profile.bot_id;
              authData.teamId =  userData.user.team_id
              installations.push(authData);
              
            
              //res.redirect('https://app.slack.com/client/' + data.user.team_id); 

              async function dbFunction() {
              
                // Returns the names of supported hash algorithms  
                // such as SHA1,MD5 
                hash = crypto.getHashes(); 
                
                // Create hash of SHA1 type 
                x = "OCBLAB"
        
                // 'digest' is the output of hash function containing  
                // only hexadecimal digits 
                hashPwd = crypto.createHash('sha1').update(x).digest('hex'); 
                const created_at = getDateformetJP(new Date());
               
                var sql = `INSERT INTO slack_users (auth_user_token, team_id, team_name, authed_user_id, login_url_token, app_id, bot_token, bot_id, bot_user_id, created_at) 
                VALUES('${data.authed_user.access_token}', '${data.team.id}', '${data.team.name}', '${data.authed_user.id}','${hashPwd}', '${data.app_id}','${authData.botToken}', '${authData.botId}', '${authData.botUserId}', '${created_at}')`;
                con.query(sql, function (err, result) {
                  if (err) throw err;
                  console.log("Data inserted");
                });

                return hashPwd;
              }
      
            dbFunction().then((pass) => {
                res.redirect(`${process.env.SERVER_URL}/login?client=${pass}&team=${data.team.id}`);
      
              }).catch(e => console.log(e));
          }
        }
        catch (error) {
          console.error(error);
        }    
    }
});

receiver.router.get('/login', async (req, res) => {

  res.sendFile(path.join(__dirname, './public/login.html'));
});

// Configuring our data parsing
receiver.router.use(express.urlencoded({
  extend: false
}));

receiver.router.use(express.static(path.join(__dirname, 'public')));

receiver.router.use(express.json());

//login token verify
receiver.router.post('/slack/tokenverify', async (req, res) => {

   makeHeadRequest(req.body.username, req.body.password, req.body.token).then((responso) => {
    if (responso == true) {
      res.json({ message: 'https://app.slack.com/client/'+req.body.team })
    }
    else {
      res.json({message: 'error'})
    }
 
   });

});

//receiver.installer.generateInstallUrl();
async function makeHeadRequest(username, password, token) {

  let global_var;
  
  await axios.post(`${process.env.API_URL}/api/token`, {
      client_id:2,
      client_secret:`${process.env.CLIENT_SECRET}`,
      client_type:"Slack",
      grant_type:"password",
      password:password,
      scope:"*",
      email:username,
      push_token:123,
    }).then(function(response) {
    
      if (response.data.success == true) {
        var sql = `UPDATE slack_users
        SET access_token = '${response.data.data.access_token}',company_id = '${response.data.data.user.company_id}'
        ,department_id = '${response.data.data.user.department_id}',user_id = '${response.data.data.user.id}'
        WHERE login_url_token = '${token}'`;

        con.query(sql, function (err, result) {
          if (err) throw err;
        });
        global_var = true;
      } else {
        global_var = response.success;
      }
    
    }).catch(function (error) {
      
      console.log(error.response)
      global_var = error;
      return global_var;
    })
    return global_var;
}

// get user info from db
async function userInfo(userId) {

  return new Promise(function(resolve, reject) {
    // The Promise constructor should catch any errors thrown on
    // this tick. Alternately, try/catch and reject(err) on catch.
    
    var sql = `SELECT * FROM slack_users
              WHERE authed_user_id = '${userId}'
              ORDER BY id DESC LIMIT 1`;

    con.query(sql, function (err, result) {
      if (err)  return reject(err);
      
      let resultData = JSON.parse(JSON.stringify(result));
      resolve(resultData);
    });    
  });

}

// Date time formate
function getDateformetJP(dateObject) {

  const options = { year: 'numeric', day: '2-digit', month: '2-digit', 
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false, hourCycle:"h24", timeZone: 'Asia/Tokyo'};

  const humanDateFormat = dateObject.toLocaleString('en-US', options) //2019-12-9 10:30:15
  const msg_date = new Date(humanDateFormat).toISOString().slice(0, 10) + " " + humanDateFormat.slice(12);
  
  return msg_date;
}

// on message shortcut
app.shortcut({ callback_id: "send_message"}, async ({ shortcut, ack, context, client, body} ) => {
  
  try {
    // Acknowledge shortcut request
    await ack();
   
    // default message user
    const messageUserId = body['message']['user'];
    let parent_msg_username;
    try {
      // Call the users.info method using the WebClient
      const result = await client.users.info({
        user: messageUserId
      });
      parent_msg_username = result['user']['name'];
    }
    catch (error) {
      console.error(error);
    }

    //Initial open
    const res = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        "type": "modal",
        "title": {
          "type": "plain_text",
          "text": "Shucrew"
        },
        "close": {
          "type": "plain_text",
          "text": "Cancel"
        },
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text": "loading..."
            }
          }
        ]
      }
    });

    const viewId = res.view.id;
    await new Promise(r => setTimeout(r, 4000));
    
    // get user info
    userInfo((body['user']['id'])).then(result => {
    
      return axios.all([
        axios.get(`${process.env.API_URL}/api/users`, {
          company_id: result[0]['company_id'],
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Bearer ${result[0]['access_token']}`
          }
        }),
        axios.get(`${process.env.API_URL}/api/praise`, {
          limit: 99999,
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Bearer ${result[0]['access_token']}`
          }
        })
      ])
      .then(axios.spread((userResponse, praiseResponse) =>{
        const merge_data = [];
        const praise_container = [];
        if (userResponse.data.success == true) {

          const data = userResponse.data.data;
        
          const user_container = [];
          if (data.length > 0) {
           
              for (let i = 0; i < data.length; i++) {
                user_container.push({
                  'text': {
                    'type': 'plain_text',
                    'text': data[i].name
                  },
                  'value':  `${data[i].id}`
                })
              }
          }
          merge_data['user'] = user_container;
        } else {
          user_container.push({
            'text': {
              'type': 'plain_text',
              'text': 'Empty'
            },
            'value':  '0'
          })
        
          merge_data['user'] = user_container;
        }

        if (praiseResponse.data.success == true) {

          const data = praiseResponse.data.data;
        
         
          if (data.length > 0) {
           
              for (let i = 0; i < data.length; i++) {
                praise_container.push({
                  'text': {
                    'type': 'plain_text',
                    'text': data[i].name
                  },
                  'value':  `${data[i].id}`
                })
              }
          }
          merge_data['praise'] = praise_container;
        } else {
          praise_container.push({
            'text': {
              'type': 'plain_text',
              'text': 'Empty'
            },
            'value':  '0'
          })
          merge_data['praise'] = praise_container;
        }
       
        return merge_data;
      })).catch(error => console.log(error));

    }).then(userList => {
 
      body['parent_msg_username'] = parent_msg_username;
      
      // view open with api data
      client.views.update({
        // Pass a valid trigger_id within 3 seconds of receiving it
       // trigger_id: shortcut.trigger_id,
        view_id: viewId,
        // View payload
        view: {
          type: 'modal',
          // View identifier
          callback_id: 'view_1',
          private_metadata: JSON.stringify(body),
          title: {
            type: 'plain_text',
            text: 'Shucrew'
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Welcome to Shucrew'
              },
            },
           
            {
              "type": "input",
              "block_id": "input_a",
              "element": {
                "type": "multi_static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true
                },
                "options": userList['user'],
                "action_id": "user_action"
              },
              "label": {
                "type": "plain_text",
                "text": "誰に贈りますか？",
                "emoji": true
              }
            },
             {
              "type": "input",
              "block_id": "input_b",
              "element": {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true
                },
                "options": userList['praise'],
                "action_id": "praise_action"
              },
              "label": {
                "type": "plain_text",
                "text": "ありがとうの種類を選んでください",
                "emoji": true
              }
            },
            {
              type: 'input',
              block_id: 'input_c',
              label: {
                type: 'plain_text',
                text: 'コメントを書きましょう'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'dreamy_input',
                multiline: true
              }
            }    
          ],
          submit: {
            type: 'plain_text',
            text: 'Submit',      
          }
        }
      });
    }).catch(error => {
      console.log('We have encountered an Error!',error); // Log an error
    });

  }
  catch (error) {
    console.error(error);
  }

  
});

// on form submit
app.view('view_1', async ({ ack, body, view, context }) => {
  // Acknowledge the view_submission event
  await ack();

  // Assume there's an input block with `block_1` as the block_id and `input_a`
  
  const msg_text = view['state']['values']['input_c']['dreamy_input'];
  const praise = view['state']['values']['input_b']['praise_action']['selected_option'];
  const receiverList = view['state']['values']['input_a']['user_action']['selected_options'];
  const receiverId = [];
  Object.values(receiverList).forEach(data => { receiverId.push(data.value); });
  const receiverParam = receiverId.toString();
  
  const msg_data = JSON.parse(body['view']['private_metadata']);
  const text_time = msg_data['message']['ts'].slice(0, 10);
  const milliseconds = parseInt(text_time) * 1000;
  const msg_date = getDateformetJP(new Date(milliseconds));
  const comment_date = getDateformetJP(new Date());
  

  await userInfo((body['user']['id'])).then(result => {

  var data = qs.stringify({
    'sender_id': result[0]['user_id'],
    'receiver_id': receiverParam,
    'category_id': praise.value,
    'comments': msg_text.value,
    'comments_date': comment_date,
    'slack_post_user_name': msg_data['parent_msg_username'],
    'slack_post': msg_data['message']['text'],
    'slack_post_date': msg_date 
    });

    var config = {
      method: 'post',
      url: `${process.env.API_URL}/api/comments`,
      headers: { 
        'X-Localization': 'en', 
        'Authorization': `Bearer ${result[0]['access_token']}`, 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data : data
    };

         
    return axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data.success));
    })
    .catch(function (error) {
      console.log(error);
    });

  })

//  if (results) {
    // DB save was successful
  //  msg = 'Your submission was successful';
  //} else {
   // msg = 'There was an error with your submission';
  //}

  // Message the user
  // try {
  //   await app.client.chat.postMessage({
  //    token: context.botToken,
  //    channel: user,
  //    text: data.value
  //  });
  // }
  // catch (error) {
  //   console.error(error);
  // }

});

receiver.router.post('/slack/ping', async (req, res) => {

  return res.json({ message: '/slack/ping' });

});
receiver.router.post('/ping', async (req, res) => {


  return res.json({ message: '/ping' });

});




(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('⚡  Bolt app is running!');
})();