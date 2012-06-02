// wait for page elements to load
$(document).ready(function () {

	// init sortable
	$(function() {
		$( "#namelist" ).sortable({
			items: ".sortable"
		});
		$( "#namelist" ).disableSelection();
	});
	
});