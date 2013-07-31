

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate.toLocaleDateString(), '</li>');
      
      
      // Only process image files.
      if (!f.type.match('.*json.*')) {
        continue;
      }
      
      var reader = new FileReader();
      
      reader.onload = (function(e) {
    	  printLog(e.target.result);
    	  var new_nodes = JSON.parse(e.target.result).nodes;
    	  var new_links = JSON.parse(e.target.result).links;
    	  for (var i=0; i<new_nodes.length; i++) {
    		  nodes.push(new_nodes[i]);
    	  }
    	  for (var i=0; i<new_links.length; i++) {
    		  //links.push(new_links[i]);
    	  }
    	  start();
      });
      reader.readAsText(f);
    }
    $('output#list').html('<ul>' + output.join('') + '</ul>');
}

$(function() {
	
	$("a#downloadLink").click(function(){
		var graph = { nodes : nodes, links : links };
	    var href = "data:application/octet-stream," + JSON.stringify(graph);
	    this.setAttribute("href", href);
	});
	$("input#submitUpload").change(function(event){
		handleFileSelect(event);
	});
	
	// EVENTS
	
	// Submit Concept
	$('input#submitConcept').click(function(){
		clearRes();
		searchCypher();
		searchConcept('http://tcng.hgc.jp/');
		searchConcept('http://ccle.acme.org/');
		searchConcept('http://my.acme.org/');
		searchConcept('http://www.biopax.org/release/');
		//searchConcept('http://www.biopax.org/release/biopax-level3.owl#');
	});
	
	// Scope
	$('#scopeRef').change(function(){
		setSelectRef();
		setSelectType();
	});
	$('#scopeType').change(function(){
		setSelectRef();
		setSelectType();
	});
	
	// STYLE
	$('#formStyle :radio').click(function(){
		draw_options.layout = $(this).attr('value');
		vis.draw(draw_options);
	});
	
	// Edge Label
	$('#formLabelEdge :radio').click(function(){
		draw_options.visualStyle.edges.label.passthroughMapper.attrName = $(this).attr('value');
		vis.draw(draw_options);
	});
	
	// Filter
	$('#filterRef').change(function(){
		filter();
	});
	$('#filterTypeConcept').change(function(){
		filter();
	});
	$('#filterTypeRelation').change(function(){
		filter();
	});
	
	// Save
	$('#pSaveXGMML').click(function(){
		saveNetwork('xgmml', vis.xgmml());
	});
	$('#pSaveGraphML').click(function(){
		saveNetwork('graphml', vis.graphml());
	});
	$('#pSaveSIF').click(function(){
		saveNetwork('sif', vis.sif('type'));
	});
	
	// Download Table
	$('input#submitDownload').click(function(){
		submitDownload();
	});
	
	// Upload
	$('input#submitUpload').click(function(){
		submitUpload();
	});
	
	// Window Height
	$('#container').height(($(window).height() - 30));
	$(window).resize(function() {
		$('#container').height(($(window).height() - 30));
	});
	
	// Tab Panel
	$('ul.panel li:not(' + $('ul.tab li a.selected').attr('name') + ')').hide();
	$('ul.tab li a').click(function(){
		showPanel(this);
		// When Tab4 is selected
		if($('ul.tab li a.selected').attr('name') == '#tab4'){
			setTypeConcept();
			setTypeRelation();
		}
	});
	
	// Float Window
	$('#titlebar_log').click(function(){
		$('#floatWindow').fadeIn('fast');
		return false;
	});
	
	$('#floatWindow a.close').click(function(){
		$('#floatWindow').fadeOut('fast');
		return false;
	});
	$('#floatWindow dl dt').mousedown(function(e){
		$('#floatWindow')
			.data('clickPointX' , e.pageX - $('#floatWindow').offset().left)
			.data('clickPointY' , e.pageY - $('#floatWindow').offset().top);
		$(document).mousemove(function(e){
			$('#floatWindow').css({
				top:e.pageY  - $('#floatWindow').data('clickPointY')+'px',
				left:e.pageX - $('#floatWindow').data('clickPointX')+'px'
			});
		});
	})
	.mouseup(function(){
		$(document).unbind('mousemove');
	});
	
	// Database Access
	getAllRef(function(){
		setSelectRef();
		getScopeTypeConcept(function(){
			setSelectType();
			setTypeConcept();
		});
		getScopeTypeRelation(function(){
			setTypeRelation();
		});
	});
	
	$('#selectRef').change(function(){
		setSelectType();
	});
	$('#scopeRef').change(function(){
		setSelectType();
		getScopeTypeConcept(function(){
			setSelectType();
			setTypeConcept();
		});
		getScopeTypeRelation(function(){
			setTypeRelation();
		});
	});
	$('#scopeType').change(function(){
		setTypeConcept();
	});
});
