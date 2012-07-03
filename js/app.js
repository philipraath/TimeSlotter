// wait for page elements to load
$(document).ready(function () {

	var Timeslotter = {

		activeTodo:null,
		state:'',
		day: moment(),
		activeDay: null,
		
		init: function() {
			
			// set initial state
			Timeslotter.setState('view');
			
			//create webSql Database
			createWebSqlDatabase();
			
			// delegate events to support DOM insertion of new Todos
			$('body').on({ 
				
				// tapping ".timeslot"...
				click: function(e){
					timeslot = $(this).attr('data-timeslot');
					date = $(this).closest('.day').attr('data-date');
					sort = $(this).next('li').attr('data-sort');
					sort = (sort)? sort + 1 : 0;
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
							Timeslotter.activeTodo = $(this).closest('li.todo');
							Timeslotter.setState('move');
							break;
						case 'edit': 
							// cancels editing
							Timeslotter.setState('view');
							break;
					}
				}
				
			}, '.move-btn').on({
				
				// swipeing left moves to next page
				swipeleft: function(e){
					Timeslotter.day.add('days', 1);
					Timeslotter.viewDay();
				},
				
				// swipeing right moves to previous page
				swiperight: function(e){
					Timeslotter.day.subtract('days', 1);
					Timeslotter.viewDay();
				},
				
			}, '.day');
			
			// show today's todos by default
			Timeslotter.viewDay();
			
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
					Timeslotter.activeTodo.addClass('popped');
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
			console.log(data);
			console.log(uuid);
			return uuid;
		},
		
		// delete a todo from the db
		deleteTodo: function(uuid) {
			//
		},
		
		// show a single day view
		// checks for existance, creates from db if not present
		viewDay: function(date) {
			if (Timeslotter.activeDay) Timeslotter.activeDay.removeClass('active');
			id = Timeslotter.day.format('YYYY-MM-DD');
			title = Timeslotter.day.format('dddd, MMM D');
			$('#days-header h4').text(title);
			Timeslotter.activeDay = $('#day-' + id );
			if (Timeslotter.activeDay.length < 1) {
				$("#days-header").after('<div data-role="content" class="day active" data-day="'+ id +'" id="day-'+ id +'">  <ul class="day-todo-list" data-role="listview" data-divider-theme="c" data-split-icon="calendar" data-split-theme="c" data-inset="false"><!-- early morning --><li data-timeslot="6am" data-role="list-divider" class="timeslot" role="header">6am</li><!-- mid-morning --> <li data-timeslot="9am" data-role="list-divider" class="timeslot" role="header">9am</li><!-- afternoon --> <li data-timeslot="12pm" data-role="list-divider" class="timeslot" role="header">12pm</li> <!-- late afternoon --> <li data-timeslot="3pm" data-role="list-divider" class="timeslot" role="header">3pm</li> <!-- evening --> <li data-timeslot="6pm" data-role="list-divider" class="timeslot" role="header">6pm</li> <!-- late evening --> <li data-timeslot="9pm" data-role="list-divider" class="timeslot" role="header">9pm</li>  </ul></div><!-- /day -->');
				Timeslotter.activeDay = $('#day-' + id );
			}
			Timeslotter.activeDay.find('.day-todo-list').listview().listview('refresh');
			Timeslotter.activeDay.addClass('active');
			console.log('view day '+id);
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
	
	function createWebSqlDatabase() {
		var db = openDatabase('mydb', '1.0', 'myFirstDatabase', 2 * 1024 * 1024);
		var addedOn = new Date();
		db.transaction(function(tx) {
			tx.executeSql("CREATE TABLE IF NOT EXISTS " +
		        "todo(ID INTEGER PRIMARY KEY ASC, column1 TEXT, column2 TEXT, column3 DATETIME)", []);
        
		tx.executeSql("INSERT INTO todo(column1, column2, column3) VALUES (?,?,?)",
                    ["item1", "ITEM2", addedOn]);
             
        });
		//WE OCCASIONALLY NEED THIS DURING DEBUGGING TO RESET THE TODO TABLE. LET'S KEEP IT UNTIL THE FINAL BUILD.
		//db.transaction(function (tx){
		//tx.executeSql('DROP TABLE todo');
		//});

	}
	
});