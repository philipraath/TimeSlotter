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
	
	// reference to todo item that's been flagged for move
	var $poppedTodo;
	
	// timeslot click
	$('.timeslot').live('click', function(e){

		if ($('body').hasClass('move')) {

			// insert the detached item in this slot
			$poppedTodo.insertAfter($(this)).removeClass('popped');
			console.log('inserted item');

			// trigger global state change
			$('body').trigger('state', 'view');

		} else {

      // insert a placeholder item
			$('<li class="todo"><a data-icon="check" class="item-body" href="#">random todo</a><a class="move-btn" data-icon="grid" href="#"></a></li>').insertAfter($(this));
			console.log('new todo inserted');
			
			// trigger jquerymobile's listview widget to rewrap all the todo items so that new elements created are rendered with the listview styles/functions/attributes/etc. 
			$(this).parent().listview('refresh');
			
			return false;

		}

	});


	// todo item click
	$('.item-body').live('click', function(e){
		
		// catch if clicked todo item is the one being moved (basically cancels move)
		if ($(this).closest('.todo').hasClass('popped')) {
			console.log('canceling move');
			$(this).removeClass('popped');
			$('body').trigger('state', 'view');	
			return false;
		}

		if ($('body').hasClass('move')) {

			// insert the detached item in this slot
			$poppedTodo.insertAfter($(this).closest('.todo')).removeClass('popped');
			console.log('inserted item');			

			// trigger global state change
			$('body').trigger('state', 'view');

		} else {

			return false;

		}

	});

	// create an event that initiates moving a todo item
	$('.move-btn').live('click', function(e){
		
		// remove this todo item but save reference
		$poppedTodo = $(this).closest('.todo').addClass('popped');

		// trigger global state change
		$('body').trigger('state', 'move');			

	});
	
});