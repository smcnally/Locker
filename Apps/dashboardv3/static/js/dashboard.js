var app;
var specialApps = {
  "allApps" : "allApps",
  "publish" : "publish",
  "viewAll" : "viewAll"
};

var iframeLoaded = function() {};

$(document).ready(function() {
  app = window.location.hash.substring(1) || $('.installed-apps a').data('id') || 'contactsviewer';
  loadApp();

  $('.iframeLink').click(function() {
    app = $(this).data('id');
    loadApp();
    return false;
  });

  $('.oauthLink').click(function() {
    var popup = window.open($(this).attr('href'), "account", "width=" + $(this).data('width') + ",height=" + $(this).data('height') + ",status=no,scrollbars=no,resizable=no");
    popup.focus();
    return false;
  });

  $('.your-apps').click(function() {
    $('.blue').removeClass('blue');
    $(this).addClass('blue');
    document.getElementById('appFrame').contentWindow.filterItems($(this).attr('id'));
  });
});

var loadApp = function(callback) {
  if (callback) {
    iframeLoaded = callback;
  } else {
    iframeLoaded = function() {};
  }
  $('.app-details').hide();
  $('.iframeLink,.your-apps').removeClass('blue');
  window.location.hash = app;
  if (specialApps[app]) {
    $("#appFrame")[0].contentWindow.location.replace(specialApps[app]);
  } else {
    $.get('clickapp/' + app, function(e) {});
    $("#appFrame")[0].contentWindow.location.replace('/Me/' + app);
  }
  $('.iframeLink[data-id="' + app + '"]').addClass('blue').parent('p').siblings().show();
};

var syncletInstalled = function(provider) {
  if (provider === 'github') {
    $('.your-apps').show();
  }
  var link = $('.oauthLink[data-provider="' + provider + '"]');
  link.children('img').addClass('installed').appendTo('.sidenav-items.synclets');
  link.remove();
};






/*  search stuff, all copypasta */

var searchWaiting = false;
var searchInterval;
var searchSelector = '.search-header-row:not(.template),.search-result-row:not(.template)';

$(document).ready(function() {
  $('#search-results').delegate(searchSelector, 'mouseover', function() {
    $('.highlighted').removeClass('highlighted');
    $(this).addClass('highlighted');
  }).delegate(searchSelector, 'mouseleave', function() {
    $(this).removeClass('highlighted');
  }).delegate(searchSelector, 'click', function() {
    $('#search-results').fadeOut();
  });

  $('.search').blur(function(){
    $('#search-results').fadeOut();
  });

  $('.search').focus(function() {
    if ($('.search')[0].value.length > 0) $('#search-results').fadeIn();
    window.setTimeout(function() {
      $('.search')[0].select();
    }, 100);
  });

  $('.search').keyup(function(e) {
    if (e.keyCode == 13) {
      if ($('.highlighted').length === 0) return true;
      $('.highlighted').click();
      $('#search-results').fadeOut();
      return false;
    } else if (e.keyCode == 38) {
      var selected = $('.search-results-wrapper').children('.highlighted');
      $('.search-results-wrapper').children('.highlighted').removeClass('highlighted');
      if (selected.prevAll(':not(.search-header-row):visible').first().length > 0) {
        selected.prevAll(':not(.search-header-row):visible').first().addClass('highlighted');
      } else {
        $('.search-results-wrapper').children(':not(.search-header-row):visible').last().addClass('highlighted');
      }
      return false;
    } else if (e.keyCode == 40) {
      var selected = $('.search-results-wrapper').children('.highlighted');
      $('.search-results-wrapper').children('.highlighted').removeClass('highlighted');
      if (selected.nextAll(':not(.search-header-row):visible').first().length > 0) {
        selected.nextAll(':not(.search-header-row):visible').first().addClass('highlighted');
      } else {
        $('.search-results-wrapper').children(':not(.search-header-row):visible').first().addClass('highlighted');
      }
      return false;
    } else {
      if ($('.search')[0].value.length == 0) {
        $('#search-results').fadeOut();
        $('.search').removeClass('populated');
      } else {
        search();
      }
    }
  });

  $('.search').bind('search', function() {
    if ($('.search')[0].value.length == 0) {
      $('#search-results').fadeOut();
      $('.search').removeClass('populated');
    }
  });
});

var searchTerm;
function search() {
  var q = searchTerm = $('.search')[0].value;
  var baseURL = '/Me/search/query';
  var star = (q.length < 3 || q.substr(-1) == ' ') ? "" : "*";
  $.get(baseURL, {q: q + star, type: 'contact*', limit: 3}, function(results) {
    processResults('people', resXform(results), q);
  });
  $.get(baseURL, {q: q + star, type: 'photo*', limit: 3}, function(results) {
    processResults('photos', resXform(results), q);
  });
  $.get(baseURL, {q: q + star, type: 'timeline/twitter*', limit: 3}, function(results) {
    processResults('tweets', resXform(results), q);
  });
  $.get(baseURL, {q: q + star, type: 'place*', limit: 3}, function(results) {
    processResults('places', resXform(results), q);
  });
  $.get('/Me/links/search', {q: q + star, limit: 3}, function(otherData) {
    processResults('links', otherData, q);
  });
}

function resXform(res) {
  if(!res || !res.hits || !res.hits.length) return [];
  return res.hits;
}

function processResults(name, results, query) {
  if(query != searchTerm) return; // bail if search changed!
  var ids = {};
  if (results !== undefined && results.length > 0) {
    for (var i = 0; i < $('.search-result-row.' + name).length; i++) {
      ids[$($('.search-result-row.' + name)[i]).attr('id')] = true;
    }
    updateHeader(name, query);
    for (var i = 0; i < results.length; i++) {
      if (results[i] !== undefined) {
        var obj = results[i];
        delete ids[obj._id];
        if ($('#' + obj._id + '.' + name).length === 0) {
          if (renderRow(name, obj) === false) {
            results.splice(i, 1);
            i--;
          }
        }
      }
    }
    for (var i in ids) {
      $('#' + i + '.' + name).remove();
    }
  } else {
    $('.search-header-row.' + name).hide();
    $('.search-result-row.' + name).remove();
  }

  $('#search-results').fadeIn();

  if ($('.search-result-row:not(.template)').length > 0) {
    $('#search-results').removeClass("no-results");
    $('.search').addClass('populated');
    if ($('.highlighted').length === 0) {
      $('#search-results').find('.search-result-row:not(.template)').first().addClass('highlighted');
    }
  } else {
    // $('#search-results').fadeOut();
    $('.search').removeClass('populated');
    $('#search-results').addClass("no-results");
  }
}

function updateHeader(name, query) {
  var header = $('.search-header-row.' + name);
  header.find('span').text("");
  header.show();
  header.unbind('click');
  header.click(function() { app = $(this).data('app'); renderApp('search-' + query); });
}

function renderRow(name, obj) {
  var newResult = $('.search-result-row.template').clone();
  newResult.removeClass('template');
  newResult.addClass(name);
  newResult.attr('id', obj._id);
  if (resultModifiers[name](newResult, obj) === false) {
    return false;
  }
  $('.search-header-row.' + name).after(newResult);
}

var resultModifiers = {};

resultModifiers.people = function(newResult, obj) {
  newResult.children('.search-result').html(obj.fullobject.name);
  if (obj.fullobject['photos']) {
    newResult.find('.search-result-icon').attr('src', obj.fullobject.photos[0]);
  } else {
    newResult.find('.search-result-icon').attr('src', '/static/img/silhouette.png');
  }
  newResult.click(function() { app = 'contacts'; renderApp('view-' + obj._id); });
}

resultModifiers.photos = function(newResult, obj) {
  newResult.children('.search-result').html(obj.fullobject.title);
  newResult.find('.search-result-icon').attr('src', obj.fullobject['thumbnail'] || obj.fullobject['url']);
  var img = newResult.find('.search-result-icon')[0];
  img.onload = function() {
    if (this.clientWidth > 36) {
      var left = (this.clientWidth - 36) / 2;
      $(this).css('left', left * -1);
    }
  }
  newResult.click(function() { app = 'photos'; renderApp('view-' + obj._id); });
}

resultModifiers.links = function(newResult, obj) {
  if (obj.title === undefined) {
    return false;
  }
  newResult.attr('title', obj.title);
  newResult.children('.search-result').html(obj.title);
  newResult.find('.search-result-icon').attr('src', obj.favicon || 'img/link.png').addClass("favicon");
  newResult.click(function() { window.open(obj.link,'_blank'); });
}

resultModifiers.places = function(newResult, obj) {
  newResult.children('.search-result').html(obj.fullobject.title);
  switch (obj.fullobject.network) {
    case 'foursquare':
      newResult.find('.search-result-icon').attr('src', '/dashboard/img/icons/foursquare.png');
    break;
    case 'twitter':
      newResult.find('.search-result-icon').attr('src', '/dashboard/img/icons/twitter.png');
    break;
    case 'latitude':
      newResult.find('.search-result-icon').attr('src', '/dashboard/img/icons/gplus.png');
    break;
    default:
      newResult.find('.search-result-icon').attr('src', 'silhouette.png');
  }
  newResult.click(function() { app = 'places'; renderApp('view-' + obj._id); });
}

resultModifiers.tweets = function(newResult, obj) {
  newResult.attr('title', obj.fullobject.text);
  newResult.children('.search-result').html(obj.fullobject.text);
  newResult.find('.search-result-icon').attr('src', obj.fullobject.user.profile_image_url_https);
  newResult.click(function() { window.open('https://www.twitter.com/' + obj.fullobject.user.screen_name + '/status/' + obj.fullobject.id_str, '_blank'); });
}

