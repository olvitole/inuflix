
// DB
//var server_url = 'http://localhost:7474';
var server_url = 'http://192.168.7.22:7474';

// Cypher Query Test
$(function() {
	// Submit Concept
	$('input#submitCypher').click(function(){
		testCypher();
	});
});

function testCypher(){
	clearCypher();
	var textCypher = $('#textCypher').val();
	// CYPHER QUERY
	v_data = {
		"query" : textCypher,
	    "params" : {}
	};
	logCypher('AJAX query posted');
	// POST
	$.ajax({
		type: 'POST',
		url: server_url + '/db/data/cypher',
		data: v_data,
		dataType: 'json',
		success: function(result){
			logCypher('AJAX result retuened');
			resultCypher(JSON.stringify(result, null, "  "));
   		},
   		error: function(XMLHttpRequest, textStatus, errorThrown) {
   			logCypher(errorThrown + " : " + XMLHttpRequest.responseText);
   		}
	});
}
function resultCypher(msg) {
	$('#resultCypher').html('<textarea cols=200 rows=20>' + msg + '</textarea>');
}
function logCypher(msg) {
	myDate = new Date();
	$('#logCypher').prepend('<p>' 
			      + fixDigit(myDate.getHours(), 2) 
			+ ':' + fixDigit(myDate.getMinutes(), 2) 
			+ '.' + fixDigit(myDate.getSeconds(), 2) 
			+ '.' + fixDigit(myDate.getMilliseconds(), 3)
			+ ' ' + msg + '</p>');
}
function clearCypher() {
	$('#resultCypher').html('');
	$('#logCypher').html('');
}
function fixDigit(num, digit) {
	var str = String(num);
	while (str.length < digit) {
		str = '0'+str;
	}
	return str;
}