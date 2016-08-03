// GLOBAL VARIABLES
var $HOST = "http://"+location.host;

angular.module("dreaderApp", [])

.controller("LibrarySceneCtrl", ['$scope', function($scope){
  $scope.books = [
    {
      author : "Viktor Frankl",
      title : "Man's Search for Meaning"
    },
    {
      author : "David Deida",
      title : "The Ways of The Superior Man"
    }
  ]
}])

.controller("BookSceneCtrl", ['$scope', function($scope){
  
}])

.controller("UniqueNavbarCtrl", ['$scope', function($scope){ 
}])


$(document).ready(function(){

// Prevent scroll
$(document).on('touchmove', function(e) {e.preventDefault();}, false);

// // Book Page
// var contentBox = $('#unique-page-holder');
// var words = contentBox.text().trim().split(' ');
// 
// function paginate() {
//   var newPage = $('<div class="page" />');
//   contentBox.empty().append(newPage);
//   var pageText = null;
//   var extraWord = '';
//   // Loop through each word in text
//   for(var i = 0; i < words.length; i++) {
//     var betterPageText;
//     if(pageText) { // If not a new page
//       betterPageText = pageText + ' ' + words[i];
//     } else if(extraWord){
//       betterPageText = extraWord + ' ' + words[i];
//     } else {       // If it is a new page
//       betterPageText = words[i];
//     }
//     newPage.text(betterPageText); // Update widget with new text
//     // If current page exceeds viewport height
//     if(newPage.height() > $(window).height() - $('.navbar').height() - $('.page-header').height() - 10) {
//       // Append page from previous loop to pages
//       PageCtrl.addPage(pageText);
//       // Update widget with old text (from previous loop)
//       newPage.text(pageText);
//       // newPage.clone().insertBefore(newPage);
//       pageText = null;
//       extraWord = words[i];
//     } else { // If current page still has space
//       pageText = betterPageText;             
//     }
//   }    
//   PageCtrl.addPage(pageText); // append last page to pages
//   PageCtrl.saveLocally(); // save pages to localStorage
//   PageCtrl.showPage(1); // show first page
// }
// $(window).resize(paginate).resize();
// 
// // Swipe
// var bookScene = document.getElementById('book-scene');
// var hammer = new Hammer(bookScene);
// hammer.on('swipeleft', function(ev){
//   PageCtrl.nextPage();
// });
// hammer.on('swiperight', function (ev) {
//   PageCtrl.prevPage();
// });
// 

// UTILITY FUNCTIONS 
// Bsn is a local bank that save and load JSON items.
var Bsn = function(){ 
  this.save = function (item_key, item) {
    localStorage.setItem(item_key, JSON.stringify(item));
  };
  this.load = function (item_key){
    return JSON.parse(localStorage.getItem(item_key));
  };
  this.exist = function(item_key) {
    return this.load(item_key) != null;
  };
  this.clear = function() {
    localStorage.clear();
  }
};

var b = new Bsn();
b.clear();


// FileServer: loads filenames from a folder
var FileServer = function(){
  this.loadFilenames = function(folder_url, selector, cb){
    $.ajax({
      url: folder_url,
      success: function(data){
        $(data).find(selector).each(function(){
          cb($(this).text());
        });
      },
    });
  };
  this.loadFile = function(file_url, cb){
    $.ajax({
      url: file_url,
      success: function(data){
        cb(data);
      }
    });
  }
};


// BookServer: has FileServer
var BookServer = function(book_folder_url){
  this.folder_url = book_folder_url;
  this.fileServer = new FileServer(); // Dependency

  this.loadBookFilenames = function(cb){
    this.fileServer.loadFilenames(this.folder_url, "a:contains('.txt')", function(each_filename){
      console.log(each_filename);
      cb(each_filename);
    });
  };

  this.loadBookText = function(filename, cb) {
    this.fileServer.loadFile(this.folder_url +'/'+filename, function(file_content){
      cb(file_content);
    });
  }

}

// Test bookServer
// var bookServer = new BookServer(book_folder_url = $HOST+"/books");
// bookServer.loadBookFilenames();
// bookServer.loadBook(filename='book1.txt');

// BookLocal: has Bsn
var BookLocal = function() {
  this.bsn = new Bsn();
  this.isBookSavedBefore = function(filename) {
    return this.bsn.exist(filename);
  }
  this.saveBook = function(filename, book) {
    this.bsn.save(filename, book);
  }
  this.loadBook = function(filename) {
    return this.bsn.load(filename);
  }
}

// Paginator
var Paginator = function(page_holder, page_class){
  this.page_holder = page_holder;
  this.page_class = page_class;

  this.paginate = this.repaginate = function(book) {
    var pages = [];
    var words = book.text.trim().split(' ');
    var newPage = $('<div class="'+this.page_class+'" />');
    this.page_holder.empty().append(newPage);
    var oldText = null;
    var extraWord = '';
    // Loop through each word in text
    for(var i = 0; i < words.length; i++) {
      var newPageText;
      if(oldText) { // If not a new page
        newPageText = oldText + ' ' + words[i];
      } else if(extraWord){
        newPageText = extraWord + ' ' + words[i];
      } else {       // If it is a new page
        newPageText = words[i];
      }
      newPage.text(newPageText); // Update widget with new text
      // If current page exceeds viewport height
      if(newPage.height() > $(window).height() - $('.navbar').height() - $('.page-header').height() - 10) {
        // Append page from previous loop to pages
        //  PageCtrl.addPage(oldText);
        pages.push(oldText);
        // Update widget with old text (from previous loop)
        newPage.text(oldText);
        // newPage.clone().insertBefore(newPage);
        oldText = null;
        extraWord = words[i];
      } else { // If current page still has space
        oldText = newPageText;             
      }
    }    
    // PageCtrl.addPage(oldText); // append last page to pages
    pages.push(oldText); // append last page to pages
    book.pages = pages;
  }
}

// Book: 
var Book = function(filename, text) {
  this.book_title = filename.replace(".txt", "");
  this.viewport_size = [$(window).width(), $(window).height()];
  this.text = text;
  this.pages = []; 
  this.paperclip = 1;

  this.getPageText = function(page_num) {
    return this.pages[page_num -1];
  };

  this.repositionPaperclip = function(old_num_of_pages) {
    var old_num_of_pages = old_num_of_pages;
    var new_num_of_pages = this.pages.length;
    var old_paperclip = this.paperclip;

    var progress = old_paperclip / old_num_of_pages;
    var new_paperclip = Math.floor(progress * new_num_of_pages);

    this.paperclip = new_paperclip; 
  };

}

var dummyXml = '<entry id="hypocrite"> <ew>hypocrite</ew> <hw>hyp*o*crite</hw> <sound> <wav>hypocr02.wav</wav> </sound> <pr>ˈhi-pə-ˌkrit</pr> <fl>noun</fl> <et>Middle English <it>ypocrite,</it> from Anglo-French, from Late Latin <it>hypocrita,</it> from Greek <it>hypokritēs</it> actor, hypocrite, from <it>hypokrinesthai</it> </et> <def> <date>13th century</date> <sn>1</sn> <dt>:a person who puts on a false appearance of <d_link>virtue</d_link> or religion</dt> <sn>2</sn> <dt>:a person who acts in contradiction to his or her stated beliefs or feelings</dt> </def> <uro> <ure>hypocrite</ure> <fl>adjective</fl> </uro> </entry>';

var Dictionary = function() {
  this.api_key = "?key="+"8d3c1550-6d45-4b66-adb9-c6772066a68c";
  this.website = "http://www.dictionaryapi.com/api/v1/references/collegiate/xml/";

  this.createEntryList = function(data_xml) {
    console.debug("DATA", data_xml);
    var entry_list = [];
    $(data_xml).find('entry').each(function(i, entry){
      var entry_word = $(entry).find('ew').text();
      var func_label = $(entry).find('fl').text();
      var def_list = [];
      $(entry).find('def').find('dt').each(function(i, def) {
        def_list.push($(def).text().replace(':',''));
      });
      entry_list.push({
        ew: entry_word,
        fl: func_label,
        defs: def_list,
      });
    });
    return entry_list;
  }

  var that = this;
  this.checkWord = function(word, cb) {
    $.ajax({
      type: "GET",
      url: this.website + word + this.api_key,
      success: function(data_xml) {
        entry_list = that.createEntryList(data_xml);
        console.debug("entry_list", entry_list);
        cb(entry_list);
      }
    }); 
  }
}

var dict = new Dictionary();
el = dict.createEntryList($.parseXML(dummyXml));
console.debug("el", el);

var DictBinder = function() {
  this.bindDict = function(event) {
    var word = event.currentTarget.innerHTML;
    
  }  
}


var Renderer = function(page_class) {
  this.page_class = page_class;
  this.dictBinder = new DictBinder();

  this.renderPage = function(book, page_num) {
    var pageText = book.getPageText(page_num);
    var words = pageText.split(' ');
    $('.' + this.page_class).empty();
    for (var i = 0, l = words.length; i < l; i++) {
      var word = words[i];
      var $word = $('<span>' + words[i] + '</span>');
      $word.on('click', this.dictBinder.bindDict);
      $('.' + this.page_class).append($word);
      $('.' + this.page_class).append(' ');
    }
  };

  this.renderFirstPage = function(book){
    this.renderPage(book, 1);
    book.paperclip = 1;
  };

  this.renderNextPage = function(book) {
    if (book.paperclip < book.pages.length) {
      this.renderPage(book, book.paperclip + 1);
      book.paperclip += 1;
    }
  }
  
  this.renderPrevPage = function(book){
    if (book.paperclip > 1){
      this.renderPage(book, book.paperclip - 1);
      book.paperclip -= 1;
    }
  }

  this.renderPaperClippedPage = function(book) {
    this.renderPage(book, book.paperclip);
  }

}

// DictModal
var DictModal = function() {
  
}


// BookScene: has BookLocal, BookServer, Book, Paginator, Renderer, DictModal
var BookScene = function(book_folder_url, filename, page_holder_class, page_class) {
  this.filename = filename;
  this.page_holder = $('.'+page_holder_class);
  this.bookServer = new BookServer(book_folder_url=book_folder_url);
  this.bookLocal = new BookLocal();
  this.paginator = new Paginator(page_holder=$('.'+page_holder_class), page_class=page_class);
  this.renderer = new Renderer(page_class=page_class);
  this.book = {};
  this.viewport = [$(window).width(), $(window).height()];
  var that = this;

  this.readBook = function() {
    if (this.bookLocal.isBookSavedBefore(this.filename)){
      console.debug("Book from localStorage");
      that.book = this.bookLocal.loadBook(that.filename);
      if (that.book.viewport === that.viewport){
        console.debug("Viewport unchanged");
        that.renderer.renderPaperclippedPage(that.book);
      } else { // Viewport changed
        console.debug("Viewport changed");
        var oldNumOfPages = that.book.pages.length;
        that.paginator.paginate(that.book);
        that.book.repositionPaperclip(oldNumOfPages);
        that.renderer.renderPaperclippedPage(that.book);
      }
    } else { // Book not saved locally
      console.debug("Book from server");
      this.bookServer.loadBookText(this.filename, function(bookText){
        that.book = new Book(filename=that.filename, text=bookText); 
        that.paginator.paginate(that.book);
        that.bookLocal.saveBook(that.filename, that.book);
        that.renderer.renderFirstPage(that.book);
        console.debug("bookpages from server", that.book.pages);
      });
    }
  }
}

// Test BookScene
bookScene = new BookScene(book_folder_url=$HOST+'/books', filename='book1.txt', page_holder_class='page-holder', page_class='page');
bookScene.readBook();




// CONTROLLER

// var PageCtrl = {
//   pages: [], // All pages of the book
//   currentPage: 1,
//   showPage: function (page_number) {
//     $('.page').text(this.pages[page_number - 1]);
//     this.currentPage = page_number;
//     console.debug("currentPage", this.currentPage);
//     this.updateProgress();
//   },
//   prevPage: function () {
//     if (this.currentPage > 1) {
//       this.showPage(this.currentPage - 1);
//     }
//   },
//   nextPage: function () {
//     if (this.currentPage < this.pages.length) {
//       this.showPage(this.currentPage + 1);
//     }
//   },
//   addPage: function(page){
//     this.pages.push(page);
//   },
//   saveLocally: function () {
//     Bsn.save("pages", this.pages); 
//   },
//   updateProgress: function () {
//     $('.page-progress').text(this.getProgress());
//   },
//   getProgress: function () {
//     var progress = this.currentPage / this.pages.length * 100;
//     var rounded = Math.round(progress * 10) / 10;
//     var one_dp = rounded.toFixed(1);
//     return one_dp + '%';
//   },
// };
}); // End $(document).ready
