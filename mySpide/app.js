/**
 * Created by Administrator on 2015/6/3 0003.
 */
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var parse = require('superagentparse');
var url = require('url');
var eventproxy = require('eventproxy');
var async = require('async');
var fs = require('fs');
var app = new express();


var w3cUrl = 'http://www.w3cfuns.com/';
app.get('/', function (req, res, next) {
    // 用 superagent 去抓取 https://cnodejs.org/ 的内容
    superagent.get(w3cUrl)
        .parse(parse('gbk'))
        .end(function (err, sres) {
            // 常规的错误处理
            if(err) {
                return next(err);
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            var $ = cheerio.load(sres.text);
            var items = [];
            var topicUrls = [];
            var article = [];

            //获取到主页所有的作者以及标题内容、文章指向的链接
            $('.list h2').each(function (index, element) {
                var $element = $(element).find("a");
                var targeturl = url.resolve(w3cUrl, $element.eq(1).attr('href'));
                items.push({
                    author: $element.eq(0).text(),
                    title: $element.eq(1).text(),
                    href: targeturl
                });
                topicUrls.push(targeturl);
            });

            //并发抓取数据
            var ep = new eventproxy();

            // 命令 ep 重复监听 topicUrls.length 次（在这里也就是 40 次） `topic_html` 事件再行动
            ep.after('topic_html', topicUrls.length, function (topics) {
                // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

                //map方法：利用传入的回调函数返回一个新的数组
                topics = topics.map(function (topicPair) {
                    var topicUrl = topicPair[0];
                    var topicHtml = topicPair[1];
                    var $ = cheerio.load(topicHtml);
                    return ({
                        title: $('.ph').text().trim(),
                        content: $('#blog_article').text()
                    });
                });
                //

                var json_temp = JSON.stringify(topics);

                fs.appendFile('data.json', json_temp, "utf8", function (err, data) {
                    if (err) {
                        console.error(err);
                    }
                    console.log('数据已经写入啦！');
                });

            });


            //获取每一篇文章的内容
            topicUrls.forEach(function (topicUrl) {
                superagent.get(topicUrl)
                    .parse(parse('gbk'))
                    .end(function (err, res){
                        console.log('抓取 ' + topicUrl + ' 成功啦');
                        //当数据抓取完成时告诉“topic_html'这个事件？否则啥也不做
                        ep.emit('topic_html', [topicUrl, res.text]);
                    });
            });


            res.send(items);

        });
});

app.listen(3000, function (req, res) {
    console.log('init!');
})

//终于成功了TAT
//编码问题搞了一点时间
//下一步可以慢慢完善了