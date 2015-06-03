/**
 * Created by Administrator on 2015/6/3 0003.
 */
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');

var app = new express();

app.get('/', function (req, res, next) {
    // �� superagent ȥץȡ https://cnodejs.org/ ������
    superagent.get('https://cnodejs.org')
        .end(function (err, sres) {
            // ����Ĵ�����
            if(err) {
                return next(err);
            }
            // sres.text ����洢����ҳ�� html ���ݣ��������� cheerio.load ֮��
            // �Ϳ��Եõ�һ��ʵ���� jquery �ӿڵı���������ϰ���Եؽ�������Ϊ `$`
            // ʣ�¾Ͷ��� jquery ��������
            var $ = cheerio.load(sres.text);
            var items = [];

            $('#topic_list .topic_title').each(function (idx, element) {
                var $element = $(element);
                items.push({
                    title: $element.attr('title'),
                    href: $element.attr('href')
                });
            });

            res.send(items);

        });
});

app.listen(3000, function (req, res) {
    console.log('init!');
})