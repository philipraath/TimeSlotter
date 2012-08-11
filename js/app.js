// wait for page elements to load
$(document).ready(function () {

	var Timeslotter = {

		activeTodo:null,
		state:'',
		day: moment(),
		activeDay: null,
		database: openDatabase('timeslotter', '', 'Timeslotter App', 2 * 1024 * 1024),
		
		init: function() {
			
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
							Timeslotter.saveTodo({'uuid':$tappedTodo.attr('data-uuid'), 'status':status});
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
				
			}, '.day').on({
			
				// when the editbox is submited save to DB and update todo's html
				submit: function(e){
					e.preventDefault();
					text = $("#todotext").val();
					uuid = Timeslotter.activeTodo.attr('data-uuid');
					Timeslotter.saveTodo({'uuid':uuid, 'text':text});
					Timeslotter.activeTodo.removeClass('active editing').find('.item-body').text(text);
					Timeslotter.setState('view');
				}
				
			}, '#editbox').on({

					tap: function(e){

						Timeslotter.dropTable('todo');
						window.setTimeout(function(){
							$("#confirmed").show();
						}, 300);

					}

				}, '#refresh-database-confirm');
			///////////////////////////////////

			// set initial state
			Timeslotter.setState('view');

			// render the editbox with jquerymobile styles (have to trigger "create" event since editbox appears outside the "page" defined by 'data-role="page"')
			$("#editbox").trigger('create');			

			// create tables for local storage
			Timeslotter.database.transaction(function(tx) {
				tx.executeSql("CREATE TABLE IF NOT EXISTS " +
			    "todo(uuid TEXT PRIMARY KEY ASC, timeslot TEXT, date TEXT, sort INTEGER, todoItem TEXT, status TEXT)", []);
			});
			
			// show today's todos by default
			Timeslotter.viewDay();

			// setswipe defaults
			$.event.special.swipe.horizontalDistanceThreshold = 15;
			$.event.special.swipe.verticalDistanceThreshold = 100;

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
					//console.log('view state');
					break;

				case 'move':
					$('body').removeClass().addClass("move");
					Timeslotter.activeTodo.addClass('popped');
					Timeslotter.state = 'move';
					//console.log('move state');
					break;

				case 'edit':
					$('body').removeClass().addClass("edit");
					Timeslotter.activeTodo.append($("#editbox")).addClass('active editing');
					$('#todotext').val(Timeslotter.activeTodo.find('.item-body').text());
					$('#editbox').show();
					Timeslotter.state = 'edit';
					//console.log('edit state');
					break;
				
			}
		},
					
		// save a todo to the db, if no uuid then create a new item
		// returns uuid on success, 0 on failure
		saveTodo: function(data) {
			
			// create new todo
			if (data['uuid'] === undefined) {
	
				// generate a UUID (approximate, not 100% reliable) from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
			  S4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
				uuid = (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	
				// save to database
				Timeslotter.database.transaction(function(tx) {
					tx.executeSql("INSERT INTO todo(uuid, timeslot, date, sort) VALUES (?,?,?,?)", [uuid, data['timeslot'], data['date'], data['sort']]);
				});
				
				// ideally would catch errors and report as well
				console.log('created new todo: '+ uuid);
			}

			// update existing todo
			else {				
				uuid = data['uuid'];
				
				// set timeslot
				if (data['timeslot'] != undefined) {
					Timeslotter.database.transaction(function(tx){
						tx.executeSql("UPDATE todo SET timeslot = ? WHERE uuid = ?", [data['timeslot'], data['uuid']], null, Timeslotter.logDBError);
					});
				}
				// set date
				if (data['date'] != undefined) {
					Timeslotter.database.transaction(function(tx){
						tx.executeSql("UPDATE todo SET date = ? WHERE uuid = ?", [data['date'], data['uuid']], null, Timeslotter.logDBError);
					});
				}
				// set sort
				if (data['sort'] != undefined) {
					Timeslotter.database.transaction(function(tx){
						tx.executeSql("UPDATE todo SET sort = ? WHERE uuid = ?", [data['sort'], data['uuid']], null, Timeslotter.logDBError);
					});
				}
				// set text
				if (data['text'] != undefined) {
					Timeslotter.database.transaction(function(tx){
						tx.executeSql("UPDATE todo SET todoItem = ? WHERE uuid = ?", [data['text'], data['uuid']], null, Timeslotter.logDBError);
					});
					console.log(data['text']);
				}
				// set status
				if (data['status'] != undefined) {
					Timeslotter.database.transaction(function(tx){
						tx.executeSql("UPDATE todo SET status = ? WHERE uuid = ?", [data['status'], data['uuid']], null, Timeslotter.logDBError);
					});
					console.log(data['status']);
				}

				// ideally would catch errors and provide some intelligent response to the user		
				console.log('updated todo: '+ data['uuid']);
			}

			return uuid;
		},
		
		// delete a todo from the db
		deleteTodo: function(uuid) {
			Timeslotter.database.transaction(function(tx){
				tx.executeSql('DELETE FROM todo WHERE uuid = ?', [uuid], null, Timeslotter.logDBError);
			});
			console.log('deleted item '+ uuid);
		},
		
		// switch to the given date, create the page & load todos from database if needed
		viewDay: function(date) {

			// hide previous day
			if (Timeslotter.activeDay) Timeslotter.activeDay.removeClass('active');

			// update date
			id = Timeslotter.day.format('YYYY-MM-DD');
			title = Timeslotter.day.format('dddd, MMM D');
			$('#days-header h4').text(title);

			// select page for given day
			Timeslotter.activeDay = $('#day-' + id );
		  Timeslotter.activeDay.addClass('active');
			if (Timeslotter.activeDay.length < 1) {

				// create page if it doesn't already exist
				$("#days-header").after('<div data-role="content" class="day active" data-day="'+ id +'" id="day-'+ id +'">  <ul class="day-todo-list" data-role="listview" data-divider-theme="c" data-split-icon="calendar" data-split-theme="c" data-inset="false"><!-- early morning --><li data-timeslot="6am" data-role="list-divider" class="timeslot" role="header">6am</li><!-- mid-morning --> <li data-timeslot="9am" data-role="list-divider" class="timeslot" role="header">9am</li><!-- afternoon --> <li data-timeslot="12pm" data-role="list-divider" class="timeslot" role="header">12pm</li> <!-- late afternoon --> <li data-timeslot="3pm" data-role="list-divider" class="timeslot" role="header">3pm</li> <!-- evening --> <li data-timeslot="6pm" data-role="list-divider" class="timeslot" role="header">6pm</li> <!-- late evening --> <li data-timeslot="9pm" data-role="list-divider" class="timeslot" role="header">9pm</li>  </ul></div><!-- /day -->');

				// select newly created page
				Timeslotter.activeDay = $('#day-' + id );
			  Timeslotter.activeDay.addClass('active').find('.day-todo-list').listview();

				// load todos from local storage
				Timeslotter.database.transaction(function(tx){

					// view todos for given day while skipping & deleting empty todos in the process
					tx.executeSql("SELECT * FROM todo WHERE date = ?",[id], function(tx, results){
						var len = results.rows.length, i;
						for (i = 0; i < len; i++) {
							item = results.rows.item(i);
							if (item.todoItem == "undefined" || item.todoItem.length < 1){
								Timeslotter.deleteTodo(item.uuid);
							}
							else {
								$('<li class="todo" data-uuid="'+ item.uuid +'" data-sort="'+ item.sort +'"><a data-icon="check" class="item-body" href="#">'+ item.todoItem +'</a><a class="move-btn" data-icon="grid" href="#"></a></li>').insertAfter(Timeslotter.activeDay.find('li[data-timeslot='+ item.timeslot +']'));
							}
						}
						// refresh jquerymobile styles AFTER asynchronous database query
						Timeslotter.activeDay.find('.day-todo-list').listview('refresh');						
					});

				});	

			}

			console.log('view day '+id);
		},
		
		sortValue: function(prev, next) {
			
			//console.log("prev not float:" + prev);
			if (prev != undefined) {
				//console.log("previous not undefined reached");
				prev = parseFloat(prev);				
			}
			//console.log("prev float: " + prev);

			//console.log("next not float: " +next);
			if (next != undefined){
				next = parseFloat(next);
			}
			
			//console.log("next float: " + next);
			
			if(prev!=undefined && next==undefined){
				sort = prev + 1;
			}
			else if(prev==undefined && next!=undefined)
			{
				sort = next -1;
			}
			else if(prev!=undefined && next!=undefined)
			{
				//console.log("prev && next reached");
				sort = (prev + next)/2;
			}
			else
			{
				sort = 0;
			}
			
			return sort;
		},
		
		dropTable: function(table) {
			console.log('drop table'+ table);
			Timeslotter.database.transaction(function (tx){
				tx.executeSql('DROP TABLE '+ table);
			});
		}, 
		
		logDBError: function(tx, error) {
			// Log webSQL errors
			console.log(error);
		}

	}


	// start the app
	Timeslotter.init();
		
});