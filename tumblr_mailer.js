var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');

var client = tumblr.createClient({
  consumer_key: 'vUHt6mXKwpW1jVsdv6VBFAP15ok9UFxrApCmi02j3uNMX7Mb8h',
  consumer_secret: 'UJhm101oBfRpc3iJHNc3nB6ISCo0CssyreRRjLxYMy9XrxE6in',
  token: 'zxzism0u9sN9OLlX13O4W4VOwA5xtV7LPEw5qE6it2TvZbTirQ',
  token_secret: 'kwg9fYgWxdUrS0TG9iOWxFiSrgeHKbw89UO00J3p8crBjB65hf'
});

var contactCsvFile = fs.readFileSync('friend_list.csv','utf8');
var emailTemplate = fs.readFileSync('email_template.ejs', 'utf-8');

function csvParse(csvFile) {
    var arr = [];
    var tempArr = [];
    var lines = csvFile.split('\n');
    var header = lines[0].split(',');
    var details = lines.slice(1);
    
    var tempObject = function(line){
        var i = 0;
        for (var key in line) {
            this[header[i]]=line[key]; 
            i++;
        }
    };
    
    for (var row in details) {
        tempArr = details[row].split(',');
        if (tempArr.length === header.length) {
            arr.push(new tempObject(tempArr));
        }
    }
    
    return arr;
}

function generateTemplates(template, contacts) {
    //this was the original ask prior to ejs templating
    var tempTemplate = template;
    var templateArr = [];
    for (var contact in contacts) {
        console.log(contacts[contact].firstName)
        tempTemplate = tempTemplate.replace('FIRST_NAME', contacts[contact].firstName);
        tempTemplate = tempTemplate.replace('NUM_MONTHS_SINCE_CONTACT', contacts[contact].numMonthsSinceContact);
        templateArr.push(tempTemplate);
        tempTemplate = template;
    }
    return templateArr;
}


var contactList = csvParse(contactCsvFile);

client.posts('danmetz.tumblr.com', function(err, blog) {
    if (err) {
        console.error(err.message);
    }
    
    var templateArr = [];
    var myPostsArr = blog.posts;
    var latestPosts = [];
    var today = new Date();
    var postDate;
    var customizedTemplate;
    
    for (var x=0; x<myPostsArr.length; x++) {
        postDate = new Date(myPostsArr[x].date);
        
        // making 45 days instead of 7 to catch most recent post
        if ((today - postDate)/(1000*24*60*60) < 45) {
            latestPosts.push({title: myPostsArr[x].title, href: myPostsArr[x].post_url});
        }
    }

    if (contactList !== [] && latestPosts !== []) {
        for (var i in contactList) {
            customizedTemplate = ejs.render(emailTemplate,
                                            {firstName: contactList[i].firstName,
                                             numMonthsSinceContact: contactList[i].numMonthsSinceContact,
                                             latestPosts: latestPosts});
            templateArr.push(customizedTemplate);
        }
    }
    //dumping out array with email templates since Mandrill not available at this time
    console.log(templateArr);
});