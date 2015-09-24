var regions = {};

var blocksLibrary = {};

// Create edit/remove options for blocks
var makeBlockOptions = function (block) {

  var blockType = $(block).attr('data-block-type');
  var blockId = $(block).attr('data-instance-id');

  var html = '';

  html += '<ul class="region-block__options">';

  if (blockType && blockId) {

    html += '  <li class="region-block__options__edit">';
    html += '    <a href="' + '/admin/block/edit/' + blockType + '/' + blockId + '">Edit this block</a>';
    html += '  </li>';
    html += '  <li class="region-block__options__delete">';
    html += '    <a href="' + '/admin/block/delete/' + blockType + '/' + blockId + '">Delete this block</a>';
    html += '  </li>';

  }

  html += '</ul>';

  var existing = $(block).find('.region-block__options');

  if (existing) {

    existing.remove();

  }

  $(block).append(html);

};

var templateBlockType = function (blockTypeId, blockTitle) {

  var html = '';

  html += '<li class="region-block" data-block-type="' + blockTypeId + '">';

  html += '  <div class="region-block__title">' + blockTitle + '</div>';

  html += '</li>';

  return html;

};

var templateBlock = function (blockId, blockType) {

  var html = '';

  html += '<li class="region-block" data-block-type="' + blockType + '" data-instance-id="' + blockId + '">';

  html += '  <div class="region-block__title">' + blockId + '</div>';

  html += '</li>';

  return html;

};

var prepareRegionsUI = function () {

  for (var region in regions) {

    // Render region container and region-blocks area

    var html = '';

    html += '<li class="region" data-region-id="' + region + '">';
    html += '  <div class="region__title">';
    html += '    <h3>' + region + '</h3></div>';
    html += '  <ul id="' + region + '-blocks" class="region-blocks">';
    html += '  </ul>';
    html += '</li>';

    $('#regions-container').append(html);

    if (regions[region].blocks) {

      regions[region].blocks.forEach(function (element) {

        var html = $.parseHTML(templateBlock(element.id, element.type));

        makeBlockOptions(html);

        $('[data-region-id="' + region + '"] .region-blocks').append(html);


      });

    }

  }

  var buildRegions = function () {

    regions = {};

    // for each Region that contains a set of blocks
    $('.region-blocks').each(function (index, region) {

      var currentRegion = $(this).parent().attr('data-region-id');

      regions[currentRegion] = [];

      $(this).find('.region-block').each(function (index, regionBlock) {

        regions[currentRegion].push({id: $(this).attr('data-instance-id'), type: $(this).attr('data-block-type')});

      });

    });

  }

  // Set up draggable groups for each region
  $('.region-blocks').each(function (index, element) {

    Sortable.create(element, {
      group: 'block-types-list',
      onAdd: function (e) {

        // If item added to region blocks
        if (e.to.classList.contains('region-blocks')) {

          var newRegion = $(e.to).parent().attr('data-region-id');
          var prevRegion = $(e.from).parent().attr('data-region-id');

          // If new instance
          if (!e.item.hasAttribute('data-instance-id')) {

            var instanceName = prompt('Instance name for new block:');

            e.item.setAttribute('data-instance-id', instanceName);

            // Use block name with block type in brackets.
            $(e.item).find(".region-block__title").html(instanceName + " <i>(" + $(e.item).find(".region-block__title").html() + ")</i>");

            buildRegions();

          }

          // If moved from another
          if (prevRegion && e.item.hasAttribute('data-instance-id')) {

            var instance = e.item.getAttribute('data-instance-id');

            buildRegions();

          }


          makeBlockOptions(e.item);

        }

      },
      onUpdate: function (e) {

        buildRegions();

      }
    });

  });

  for (var blockType in blocksLibrary) {

    var html = templateBlockType(blockType, blocksLibrary[blockType].name);

    $('#block-types-list').append(html);

  }

  // Set up draggable blocks in block types library
  Sortable.create($('#block-types-list')[0], {
    group: {
      name: 'block-types-list',
      pull: 'clone',
      put: false
    }
  });

};

$(document).ready(function () {

  /* Form handlers, events, etc */

  $('#block-config-form').submit(function (e) {

    e.preventDefault();

    $.post('/regions/save', {
      regions: regions
    }, function (data) {

      location.reload();

    });

  });

  /* Initialisation */

  $.get('/blockTypes/get', {}, function (data) {

    blocksLibrary = data.response;

    $.get('/regions/get', {}, function (data) {

      if (data.status === 200 && data.response) {

        regions = data.response;

        prepareRegionsUI();

      }

    }, 'json');

  }, 'json');

});
