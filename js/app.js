// wait for page elements to load
$(document).ready(function () {

	var Timeslotter = {

		activeTodo:null,
		state:'',
		
		init: function() {
			
			// set initial state
			Timeslotter.setState('view');
			
			// delegate events to support DOM insertion of new Todos
			$('body').on({ 
				
				// tapping ".timeslot"...
				click: function(e){
					timeslot = $(this).attr('data-timeslot');
					date = $(this).closest('.day').attr('data-date');
					sort = $(this).next('li').attr('data-sort') + 1; 
					switch(Timeslotter.state) {
						case 'view':
							// creates new todo
							if ( uuid = Timeslotter.saveTodo({'timeslot':timeslot, 'date':date, 'sort':sort}) ) {
								Timeslotter.activeTodo = $('<li class="todo" data-uuid="'+ uuid +'" data-sort="'+ sort +'"><a data-icon="check" class="item-body" href="#"></a><a class="move-btn" data-icon="grid" href="#"></a></li>')
									.insertAfter($(this));
								$(this).parent().listview('refresh');
								Timeslotter.setState('edit');
							}
							break;
						case 'move':
							// moves active todo to this timeslot
							if (uuid = Timeslotter.activeTodo.attr('data-uuid')) {
								Timeslotter.saveTodo({'uuid':uuid, 'timeslot':timeslot, 'date':date, 'sort':sort});
								Timeslotter.activeTodo.insertAfter($(this)).removeClass('popped');
							}
							Timeslotter.setState('view');
							break;
						case 'edit':
							// cancels editing
							Timeslotter.setState('view');
							break;
					}
				}

			}, '.timeslot').on({ 
				
				// tapping ".item-body"...
				click: function(e){
					$tappedTodo = $(this).closest('.todo');
					timeslot = $tappedTodo.prev('.timeslot').attr('data-timeslot');
					date = $tappedTodo.closest('.day').attr('data-date');
					sort = $tappedTodo.attr('data-sort') + 1;
					switch(Timeslotter.state) {
						case 'view':
							// completes/uncompletes todo
							status = ($tappedTodo.toggleClass('completed').hasClass('completed'))? 'completed':'';
							Timeslotter.saveTodo($tappedTodo.attr('data-uuid'), {'status':status});
							break;
						case 'move':
							// inserts active todo unless clicked same todo
							if ( !$tappedTodo.is(Timeslotter.activeTodo) ) {
								Timeslotter.activeTodo.insertAfter($tappedTodo).removeClass('popped');								
								Timeslotter.saveTodo({'uuid':Timeslotter.activeTodo.attr('data-uuid'), 'timeslot':timeslot, 'date':date, 'sort':sort});
							}
							Timeslotter.setState('view');
							break;
						case 'edit':
							// cancels editing
							Timeslotter.setState('view');
							break;
					} 
				},	
				
				// tapholding '.item-body'...
				taphold: function(e){
					if (Timeslotter.state == 'view') {
						// initiates editing for this todo
						Timeslotter.activeTodo = $(this).closest('.todo');
						Timeslotter.setState('edit');
					}
				}

			}, '.item-body').on({
				
				// tapping '.move-btn'...
				click: function(e){
					switch(Timeslotter.state) {
						case 'view':
							// prepares todo to be moved
							Timeslotter.activeTodo = $(this).closest('.todo');
							Timeslotter.setState('move');
							alert('tapped move-btn');
							break;
						case 'edit': 
							// cancels editing
							Timeslotter.setState('view');
							break;
					}
				}
				
			}, '.move-btn').on({
				
				// swipeing left moves to next page
				swipeLeft: function(e){
					alert('swiped left');
					$page = $.mobile.activePage.next('.day');
					if ($page.length > 0) {	
						$.mobile.changePage($page);						
						console.log('page changed to '+ $page.attr('id'));
					} else {
						console.log('no more days')
					}
				},
				
				// swipeing right moves to previous page
				swipeRight: function(e){
					alert('swiped right');
					$page = $.mobile.activePage.prev('.day');
					if ($page.length > 0) {	
						$.mobile.changePage($page);						
						console.log('page changed to '+ $page.attr('id'));
					} else {
						console.log('no more days')
					}
				},					
				
			}, '.day');

			// renders the editbox with jquerymobile styles since it's outside the page's HTML
			// and on submit saves the data and updates display
			$("#editbox").trigger('create').submit(function(e){
				e.preventDefault();
				text = $("#todotext").val();
				uuid = Timeslotter.activeTodo.attr('data-uuid');
				Timeslotter.saveTodo({'uuid':uuid, 'text':text});
				Timeslotter.activeTodo.removeClass('active').find('.item-body').text(text);
				Timeslotter.setState('view');
			});

		},    
		
		setState:function(s) {
			switch(s) {
				case 'view':
					$('body').removeClass().addClass("view");
					$("#editbox").appendTo('body').hide();
					$('.item-body:empty').each(function(i){
						uuid = $(this).closest('.todo').attr('data-uuid');
						Timeslotter.deleteTodo(uuid);
						$(this).closest('.todo').remove();
					});
					Timeslotter.state = 'view';
					console.log('view state');
					break;

				case 'move':
					$('body').removeClass().addClass("move");
					Timeslotter.state = 'move';
					console.log('move state');
					break;

				case 'edit':
					$('body').removeClass().addClass("edit");
					Timeslotter.activeTodo.append($("#editbox")).addClass('active');
					$('#todotext').val(Timeslotter.activeTodo.find('.item-body').text());
					$('#editbox').show();
					Timeslotter.state = 'edit';
					console.log('edit state');
					break;
				
			}
		},
		
		// save a todo to the db, if no uuid then create a new item
		// returns uuid on success, 0 on failure
		saveTodo: function(data) {
			uuid = (data['uuid'] === undefined)? newUUID() : data['uuid'];
			return uuid;
		},
		
		// delete a todo from the db
		deleteTodo: function(uuid) {
			//
		},
		
		// show a single day view
		// checks for existance, creates from db if not present
		viewDay: function(date) {
			$day = $("#day-"+date);
			if ($day.length == 0) {
				// pull from db
			} 
			// switch to this page
			
		}

	}

	// initialize the app
	Timeslotter.init();

	/*
	 * Helper Functions
	 */

	// helper function to create a UUID (approximate, not 100% reliable) from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	function newUUID() {
	  var S4 = function() {
	    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	  };
	  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	}
	
});