// wait for page elements to load
$(document).ready(function () {

	// create state change event
	$('body').bind('state', function(e, type){

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
	
	// set default state onload
	$('body').trigger('state', 'view');	
	
	var $poppedTodo;
	
	// timeslot click
	$('.timeslot').click(function(e){

		if ($('body').hasClass('move')) {

			// insert the detached item in this slot
			$(this).after($poppedTodo);
			console.log('inserted item');			

			// trigger global state change
			$('body').trigger('state', 'view');

		} else {

			console.log('timeslot should insert item');
			alert('insert item into this timeslot');
			return false;

		}

	});


	// todo item click
	$('.item-body').click(function(e){

		if ($('body').hasClass('move')) {

			// insert the detached item in this slot
			$(this).closest('.todo').after($poppedTodo);
			console.log('inserted item');			

			// trigger global state change
			$('body').trigger('state', 'view');

		} else {

			return false;

		}

	});

	// create an event that initiates moving a todo item
	$('.move-btn').click(function(e){
		
		// remove this todo item but save reference
		$poppedTodo = $(this).closest('.todo').detach();

		// trigger global state change
		$('body').trigger('state', 'move');			

	});
	
});