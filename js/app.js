// wait for page elements to load
$(document).ready(function () {

	// state change event
	$('body').bind('state', function(e, type){
		switch(type) {

			case 'view':
				$('body').removeClass().addClass("view");
				$("#editbox").appendTo('body').hide();
				$('.item-body:empty').closest('.todo').remove();
				console.log('view');
				break;
							
			case 'move':
				$('body').removeClass().addClass("move");
				console.log('move');
				break;

			case 'edit':
				$('body').removeClass().addClass("edit");
				$activeTodo.append($("#editbox")).addClass('active');
				$('#todotext').val($activeTodo.find('.item-body').text());
				$('#editbox').show().focus();
				console.log('edit');
				break;

		}		
	// timeslot click/tap event
	}).on('click', '.timeslot' , function(e){
		switch(get_state()) {

			case 'view':
	      // insert a placeholder item
				$activeTodo = $('<li class="todo" data-uuid="'+ newUUID() +'"><a data-icon="check" class="item-body" href="#"></a><a class="move-btn" data-icon="grid" href="#"></a></li>').insertAfter($(this));
				// trigger jquerymobile's listview widget to rewrap all the todo items so that new elements created are rendered with the listview styles/functions/attributes/etc. 
				$(this).parent().listview('refresh');
				set_state('edit');
				break;

			case 'move':
				// insert the detached item in this slot
				$activeTodo.insertAfter($(this)).removeClass('popped');
				set_state('view');
				break;

			case 'edit':
				set_state('view');
				break;

		}
	// bodytext click/tap event
	}).on({
		click: function(e){
			switch(get_state()) {

				case 'view':
					// complete/uncomplete
					$(this).closest('.todo').toggleClass('completed');
					break;

				case 'move':
					if ($(this).closest('.todo').hasClass('popped')) {
						// cancel move if clicked on the popped todo
						$(this).removeClass('popped');
						set_state('view');	
					} else {
						// insert the detached item in this slot
						$activeTodo.insertAfter($(this).closest('.todo')).removeClass('popped');
						set_state('view');				
					}
					break;

				case 'edit':
					set_state('view');
					break;			

			}
			
		},	
		taphold: function(e){		
			switch(get_state()) {

				case 'view':
					$activeTodo = $(this).closest('.todo');
					set_state('edit');
					break;

				case 'move':
					if ($(this).closest('.todo').hasClass('popped')) {
						// cancel move if clicked on the popped todo
						$(this).removeClass('popped');
						set_state('view');	
					} else {
						// insert the detached item in this slot
						$activeTodo.insertAfter($(this).closest('.todo')).removeClass('popped');
						set_state('view');				
					}
					break;

				case 'edit':
					set_state('view');
					break;			

			}

		}	
		
	// move-btn click/tap event
	}, '.item-body').on('click', '.move-btn', function(e){

		// flag todo as in process of being moved
		$activeTodo = $(this).closest('.todo').addClass('popped');
		set_state('move');			

	// editbox submission event to update text
	}).on('updateText', '.todo', function(e){
		$(this).removeClass('active').find('.item-body').text($("#todotext").val());
		set_state('view');
	});
	


	/*
	 * Helper Functions
	 */

	// helper functions to get/set state of app
	function get_state() {
		return $('body').attr('class');
	}
	function set_state(state) {
		$('body').trigger('state', state);
	}

	// helper function to create a UUID (approximate, not 100% reliable) from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	function newUUID() {
	  var S4 = function() {
	    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	  };
	  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	}


	/*
	 * Init
	 */

	// render the editbox with jquerymobile styles manually b/c outside page on load and trigger edit submission
	$("#editbox").trigger('create').submit(function(e){
		e.preventDefault();
		$(this).closest('.todo').trigger('updateText');
	});

	// set default state onload
	set_state('view');	
		
	// reference to currently active todo item
	var $activeTodo;

	
});