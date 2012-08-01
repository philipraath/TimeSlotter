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
			
			//PRELIMINARY DATABASE TESTING
			//delete previous webSql Database
				//deleteWebSqlDatabase();
			//create webSql Database
				createWebSqlDatabase();
			//call newDBItem to insert todo data into database
				//newDBItem();
			//call readDB to test if database is being read
			//console will display "readDB reached" if function is called
			readDB();
			
			// delegate events to support DOM insertion of new Todos
			$('body').on({ 
				
				// tapping ".timeslot"...
				click: function(e){
					timeslot = $(this).attr('data-timeslot');
					date = $(this).closest('.day').attr('data-day');
					prev = $(this).prev('li').attr('data-sort');
					next = $(this).next('li').attr('data-sort');
					sort = Timeslotter.sortValue(prev, next);
					
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
								prev = Timeslotter.activeTodo.prev('li').attr('data-sort');
								next = Timeslotter.activeTodo.next('li').attr('data-sort');
								sort = Timeslotter.sortValue(prev, next);
								console.log("current sort assignment: "+ sort);
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
			//console.log("saveTodo reached");
			//console.log("data object:" + data);
			//uuid = (data['uuid'] === undefined)? newUUID() : data['uuid'];
			if (data['uuid'] === undefined) {
				uuid = newUUID();
				timeslot = data['timeslot'];
				date = data['date'];
				sort = data['sort'];
				newDBItem(uuid, timeslot, date, sort); //want to pass newUUID() as argument in newDBItem
			}
			else {
				console.log("saveTodo else reached");
				uuid = data['uuid'];
				todoItem = data['text'];
				//console.log("text data:" + todoItem);
				updateDBItem(uuid, undefined, undefined, sort, todoItem); // pass uuid id to select item
			}
			//console.log(data);
			//console.log(uuid);
			//call newDBItem to insert todo data into database
								//newDBItem();
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
		},
		
		sortValue: function(prev, next) {
			
			console.log("prev not float:" + prev);
			if (prev != undefined) {
				console.log("previous not undefined reached");
				prev = parseFloat(prev);				
			}
			console.log("prev float: " + prev);

			console.log("next not float: " +next);
			if (next != undefined){
				next = parseFloat(next);
			}
			
			console.log("next float: " + next);
			
			if(prev!=undefined && next==undefined){
				sort = prev + 1;
			}
			else if(prev==undefined && next!=undefined)
			{
				sort = next -1;
			}
			else if(prev!=undefined && next!=undefined)
			{
				console.log("prev && next reached");
				sort = (prev + next)/2;
			}
			else
			{
				sort = 0;
			}
			
			return sort;
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
		db.transaction(function(tx) {
			tx.executeSql("CREATE TABLE IF NOT EXISTS " +
		        "todo(uuid TEXT PRIMARY KEY ASC, timeslot TEXT, date TEXT, sort INTEGER, todoItem TEXT)", []);
             
		});
	}
	
	function deleteWebSqlDatabase() {
		var db = openDatabase('mydb', '1.0', 'myFirstDatabase', 2 * 1024 * 1024);
		db.transaction(function (tx){
		tx.executeSql('DROP TABLE todo');
		});
		
	}
	
	//TODO: create helper function to add new items to database
	function newDBItem(uuid, timeslot, date, sort, todoItem) {
		console.log("newDBItem reached");
		//static placeholder code, just to make sure it works
		var db = openDatabase('mydb', '1.0', 'myFirstDatabase', 2 * 1024 * 1024);
		//console.log("newDBItem reached 2");
		var currentDate = new Date();// temporary for testing
		db.transaction(function(tx) {
			//console.log("newDBItem reached 3");
			tx.executeSql("INSERT INTO todo(uuid, timeslot, date, sort, todoItem) VALUES (?,?,?,?,?)", [uuid, timeslot, date, sort, todoItem]);
			//console.log("newDBItem reached 4");
		});
	}
	
	//TODO: create helper function to update items in database
	function updateDBItem(uuid, timeslot, date, sort, text) {
		console.log("updateDBItem reached");
		var db = openDatabase('mydb', '1.0', 'myFirstDatabase', 2 * 1024 * 1024);
		if(timeslot!=undefined){
			db.transaction(function(tx){
			tx.executeSql("UPDATE todo SET timeslot = ? WHERE uuid = ?", [timeslot, uuid], null, onError);
		});
		}
		if(date!=undefined){
			db.transaction(function(tx){
			tx.executeSql("UPDATE todo SET date = ? WHERE uuid = ?", [date, uuid], null, onError);
		});
		}
		if(sort!=undefined){
			db.transaction(function(tx){
			tx.executeSql("UPDATE todo SET sort = ? WHERE uuid = ?", [sort, uuid], null, onError);
		});
		}
		if(text!=undefined){
			console.log("text not undefined reached");
			console.log("uuid: "+ uuid);
			console.log("todo item: " + text);
			db.transaction(function(tx){
			tx.executeSql("UPDATE todo SET todoItem = ? WHERE uuid = ?", [text, uuid], null, onError);
			console.log("end of if reached");
			
		});
		}	
	}
	
	// Log webSQL errors
	function onError(tx, error) {
	log.innerHTML += '<p>' + error.message + '</p>';
	}
	
	//TODO: create helper function to read database
	function readDB() {
		console.log("readDB reached");
		var db = openDatabase('mydb', '1.0', 'myFirstDatabase', 2 * 1024 * 1024);
		db.transaction(function(tx){
			tx.executeSql("SELECT * FROM todo",[], function(tx, results){
				
					var len = results.rows.length, i;
					for (i = 0; i < len; i++)
					{
						console.log("inner readDB reached");
						console.log(results.rows.item(i));
					}
				}
			);
		});
	}
	
});