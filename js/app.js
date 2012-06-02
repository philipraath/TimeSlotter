// wait for page elements to load
$(document).ready(function () {

	// set default state onload
	$('body').trigger('state', 'view');

	// create state change event
	$('body').bind('state', function(type){
		switch(type) {
			
			case 'view':
				$('body').removeClass().addClass("view");
				console.log('changing state to "view"');
				break;
							
			case 'move':
				$('body').removeClass().addClass("move");
				console.log('changing state to "move"');
				break;
		}
	});
	
	// create an event that initiates moving a todo item
	$('.todo').click(function(e){
		
		if ($('body').hasClass('move')) {
			
			// insert the detached item in this slot
			$(this).after($selectedToDo);
			console.log('inserted item');			

			// trigger global state change
			$('body').trigger('state', 'view');

		} else {

			// remove this todo item but save reference
			$selectedToDo = $(this).detach();

			// trigger global state change
			$('body').trigger('state', 'move');
			
		}
		
	});
	
});