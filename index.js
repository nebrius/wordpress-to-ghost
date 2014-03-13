/*
The MIT License (MIT)

Copyright (c) 2014 Bryan Hughes <bryan@theoreticalideations.com> (http://theoreticalideations.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var fs = require('fs');
var path = require('path');
var url = require('url');
var config = require('./config');


function validateEntryPath(name) {
  if (!config.hasOwnProperty(name)) {
    console.error('Missing config entry ' + name + '\n');
    process.exit(1);
  }
  if (!fs.existsSync(config[name])) {
    console.error('The path supplied for ' + name + ' does not exist\n');
    process.exit(1);
  }
}

function validateEntryURL(entryUrl) {
  if (!config.hasOwnProperty(entryUrl)) {
    console.error('Missing config entry ' + entryUrl + '\n');
    process.exit(1);
  }
  entryUrl = config[entryUrl];
  var parsedURL = url.parse(entryUrl);
  if (!parsedURL.protocol || !parsedURL.host) {
    console.error('Midding protocol or host in ' + entryUrl + '\n');
    process.exit(1);
  }
  if (/\/$/.test(entryUrl)) { // Trim off trailing slashes
    entryUrl = entryUrl.substring(0, entryUrl.length - 1);
  }
  return entryUrl;
}

// Vaalidate the exported data path
validateEntryPath('exported-data-path');

// Validate the export path
if (!config.hasOwnProperty('output-path')) {
  console.error('Missing config entry media-output-dir\n');
  process.exit(1);
}
if (!fs.existsSync(path.dirname(config['output-path']))) {
  console.error('The path supplied for media-output-dir does not exist\n');
  process.exit(1);
}

// Validate the media server base
var oldServerUrl = validateEntryURL('old-server-url');
var newServerMediaUrl = validateEntryURL('new-server-media-url');

// Read in the exported data
var exportedData = require(config['exported-data-path']);

var nonText = /[^a-zA-Z]/;
function processText(linkCallback, options) {
  options = options || {};
  exportedData.data.posts.forEach(function (post) {
    if (options.log == 'titles') {
      console.log('Parsing "' + post.title + '"');
    }

    function parseText(source) {

      var text = post[source];

      function changeState(newState) {
        //console.log('Changing state: ' + newState);
        state = newState;
      }

      var i = 0;
      var len = text.length;
      var state = 'scanning';
      var linkStartIndex;

      while(i < len) {
        switch(state) {
        case 'scanning':
          if (text[i++] == '<') {
            if (text[i] == 'a' && nonText.test(text[i + 1])) {
              changeState('anchorTag');
              i += 2;
            }
            if (text.substring(i, i + 3) == 'img' && nonText.test(text[i + 3])) {
              changeState('imgTag');
              i += 4;
            }
          }
          break;
        case 'anchorTag':
          if (text.substring(i, i + 4) == 'href') {
            changeState('anchorHrefOuter');
            i += 4;
          } else {
            if (text[i++] == '>') {
              changeState('scanning');
            }
          }
          break;
        case 'anchorHrefOuter':
          if (text[i++] == '"') {
            linkStartIndex = i;
            changeState('anchorHrefInner');
          }
          break;
        case 'anchorHrefInner':
          if (text[i] == '"') {
            linkCallback({
              text: text,
              start: linkStartIndex,
              end: i,
              type: 'a',
              post: post,
              source: source
            });
            changeState('anchorTag');
          }
          i++;
          break;
        case 'imgTag':
          if (text.substring(i, i + 3) == 'src') {
            changeState('imgSrcOuter');
            i += 3;
          } else {
            if (text[i++] == '>') {
              changeState('scanning');
            }
          }
          break;
        case 'imgSrcOuter':
          if (text[i++] == '"') {
            linkStartIndex = i;
            changeState('imgSrcInner');
          }
          break;
        case 'imgSrcInner':
          if (text[i] == '"') {
            linkCallback({
              text: text,
              start: linkStartIndex,
              end: i,
              type: 'img',
              post: post,
              source: source
            });
            changeState('imgTag');
          }
          i++;
          break;
        }
      }
    }
    parseText('html');
    parseText('markdown');
  });
}

// Build the list of image URLs
var imageMap = {};
processText(function (link) {
  if (link.type == 'img') {
    var href = link.text.substring(link.start, link.end);
    var match = new RegExp('^' + oldServerUrl + '/wp-content/uploads(.*)$').exec(href);
    if (match && !imageMap[href]) {
      imageMap[href] = newServerMediaUrl + match[1];
      console.log('  Found link to update: ' + href);
    }
  }
}, { log: 'titles' });

// Determine the changes to make
processText(function (link) {
  var href = link.text.substring(link.start, link.end);
  if (imageMap[href]) {
    link.post.changes = link.post.changes || [];
    link.post.changes.push({
      start: link.start,
      end: link.end,
      source: link.source,
      newText: imageMap[href]
    });
  }
});

// Update the image URLs
console.log('');
exportedData.data.posts.forEach(function (post) {
  // iterate backwards to avoid having to update indices with each iteration
  if (post.changes) {
    var changes = post.changes;
    var i = changes.length - 1;
    console.log('Updating URLS for post "' + post.title + '"');
    for (; i >= 0; i--) {
      var change = changes[i];
      var textToChange = post[change.source];
      post[change.source] =
        textToChange.substring(0, change.start) +
        change.newText +
        textToChange.substring(change.end);
    }
    delete post.changes;
  }
});

// Write to a file
console.log('\nWriting updated data to ' + config['output-path']);
fs.writeFileSync(config['output-path'], JSON.stringify(exportedData, 0, '  '));
console.log('Finished exporting data\n');