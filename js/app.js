// wait for page elements to load
$(document).ready(function () {

	// state change event
	$('body').bind('state', function(e, type){
		switch(type) {

			case 'view':
				$('body').removeClass().addClass("view");
				console.log('view');
				break;
							
			case 'move':
				$('body').removeClass().addClass("move");
				console.log('move');
				break;

			case 'edit':
				$('body').removeClass().addClass("edit");
				$activeTodo.append($("#editbox")).addClass('active');
				$('#editbox').show();
				console.log('edit');
				break;

		}		
	// timeslot click/tap event
	}).on('click', '.timeslot' , function(e){
		switch(get_state()) {

			case 'view':
	      // insert a placeholder item
				$activeTodo = $('<li class="todo"><a data-icon="check" class="item-body" href="#">random item</a><a class="move-btn" data-icon="grid" href="#"></a></li>').insertAfter($(this));
				// trigger jquerymobile's listview widget to rewrap all the todo items so that new elements created are rendered with the listview styles/functions/attributes/etc. 
				$(this).parent().listview('refresh');
				$('body').trigger('state', 'edit');
				break;

			case 'move':
				// insert the detached item in this slot
				$activeTodo.insertAfter($(this)).removeClass('popped');
				$('body').trigger('state', 'view');
				break;

			case 'edit':
				break;			

		}
	// bodytext click/tap event
	}).on('click', '.item-body', function(e){
		switch(get_state()) {

			case 'view':
				break;			

			case 'move':
				if ($(this).closest('.todo').hasClass('popped')) {
					// cancel move if clicked on the popped todo
					$(this).removeClass('popped');
					$('body').trigger('state', 'view');	
				} else {
					// insert the detached item in this slot
					$activeTodo.insertAfter($(this).closest('.todo')).removeClass('popped');
					$('body').trigger('state', 'view');				
				}
				break;

			case 'edit':
				break;			

		}
	// move-btn click/tap event
	}).on('click', '.move-btn', function(e){

		// remove this todo item but save reference
		$activeTodo = $(this).closest('.todo').addClass('popped');
		$('body').trigger('state', 'move');			

	});
	


	/*
	 * Helper Functions
	 */

	// helper function to check state of app
	function get_state() {
		return $('body').attr('class');
	}


	/*
	 * Init
	 */
	
	// set default state onload
	$('body').trigger('state', 'view');	
		
	// reference to currently active todo item
	var $activeTodo;

	// render the editbox with jquerymobile styles manually b/c outside page on load
	$("#editbox").trigger('create').hide().submit(function(e){
		e.preventDefault();
	});
	
});