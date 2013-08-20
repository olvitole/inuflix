
$(function() {
	
	// Submit Concept
	$('input#submitConcept').click(function(){
		clearRes();
		//searchCypher();
		searchConcept('http://tcng.hgc.jp/');
		//searchConcept('http://ccle.acme.org/');
		//searchConcept('http://my.acme.org/');
		//searchConcept('http://www.biopax.org/release/');
		//searchConcept('http://www.biopax.org/release/biopax-level3.owl#');
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
});
