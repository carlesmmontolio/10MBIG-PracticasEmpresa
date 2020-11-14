////////////////////////////////////////////////  ENTRADAS /////////////////////////////////////////////////////////

//// INPUT EXCEL ////

inputExcel = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "inputExcel",
	
    init : function(attr)
    {
    	this._super($.extend({bgColor:"#dbddde", color:"#d7d7d7", stroke:1, radius:3},attr));
        
      
        this.classLabel = new draw2d.shape.basic.Label({
            text:"Excel", 
            stroke:1,
            fontColor:"#ffffff",  
            bgColor:"#83d0c9", 
            radius: this.getRadius(), 
            padding:10,
            resizeable:true,
            editor:new draw2d.ui.LabelInplaceEditor()
        });
       
        
        this.add(this.classLabel);
    },
     
    /**
     * @method
     * Add an entity to the db shape
     * 
     * @param {String} txt the label to show
     * @param {Number} [optionalIndex] index where to insert the entity
     */
    addEntity: function(optionalIndex)
    {
	   	 var label =new draw2d.shape.basic.Label({
	   	     text:"Input",
	   	     stroke:0.2,
	   	     radius:0,
	   	     bgColor:"#ffffff",
	   	     padding:{left:40, top:3, right:10, bottom:5},
	   	     fontColor:"#009688",
	   	     resizeable:true,
             editor:new draw2d.ui.LabelEditor()
	   	 });

        label.installEditor(new draw2d.ui.LabelEditor());

	     var output= label.createPort("output");
	     

         output.setName("output_"+label.id);
         
         var _table=this;
         label.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });
         
	     if($.isNumeric(optionalIndex)){
             this.add(label, null, optionalIndex+1);
	     }
	     else{
	         this.add(label);
	     }

	     return label;
    },
    
    /**
     * @method
     * Remove the entity with the given index from the DB table shape.<br>
     * This method removes the entity without care of existing connections. Use
     * a draw2d.command.CommandDelete command if you want to delete the connections to this entity too
     * 
     * @param {Number} index the index of the entity to remove
     */
    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    /**
     * @method
     * Returns the entity figure with the given index
     * 
     * @param {Number} index the index of the entity to return
     */
    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },

     /**
      * @method
      * Set the name of the DB table. Visually it is the header of the shape
      * 
      * @param name
      */
     setName: function(name)
     {
         this.classLabel.setText(name);
         
         return this;
     },
     
     /**
      * @method 
      * Return an objects with all important attributes for XML or JSON serialization
      * 
      * @returns {Object}
      */
     getPersistentAttributes : function()
     {
         var memento= this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){
            
            if(i>0){ // skip the header of the figure
                memento.entities.push({
                    text:e.figure.getText(),
                    id: e.figure.id
                });
            }
        });
         
         return memento;
     },
     
     /**
      * @method 
      * Read all attributes from the serialized properties and transfer them into the shape.
      *
      * @param {Object} memento
      * @return
      */
     setPersistentAttributes : function(memento)
     {
         this._super(memento);
         
         this.setName(memento.name);

         if(typeof memento.entities !== "undefined"){
             $.each(memento.entities, $.proxy(function(i,e){
                 var entity =this.addEntity(e.text);
                 entity.id = e.id;
                 entity.getOutputPort(0).setName("output_"+e.id);
             },this));
         }

         return this;
     }  

});

//// INPUT SHAPEFILE ////

inputShp = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "inputShp",
	
    init : function(attr)
    {
    	this._super($.extend({bgColor:"#dbddde", color:"#d7d7d7", stroke:1, radius:3},attr));
        
      
        this.classLabel = new draw2d.shape.basic.Label({
            text:"Shapefile", 
            stroke:1,
            fontColor:"#ffffff",  
            bgColor:"#83d0c9", 
            radius: this.getRadius(), 
            padding:10,
            resizeable:true,
            editor:new draw2d.ui.LabelInplaceEditor()
        });
       
        
        this.add(this.classLabel);
    },
     
    /**
     * @method
     * Add an entity to the db shape
     * 
     * @param {String} txt the label to show
     * @param {Number} [optionalIndex] index where to insert the entity
     */
    addEntity: function(optionalIndex)
    {
	   	 var label =new draw2d.shape.basic.Label({
	   	     text:"Input",
	   	     stroke:0.2,
	   	     radius:0,
	   	     bgColor:"#ffffff",
	   	     padding:{left:40, top:3, right:10, bottom:5},
	   	     fontColor:"#009688",
             resizeable:true,
             editor:new draw2d.ui.LabelEditor()
	   	 });

        label.installEditor(new draw2d.ui.LabelEditor());

	     var output= label.createPort("output");
	     
         output.setName("output_"+label.id);
         
         var _table=this;
         label.on("contextmenu", function(emitter, event){
             $.contextMenu({
                 selector: 'body', 
                 events:
                 {  
                     hide:function(){ $.contextMenu( 'destroy' ); }
                 },
                 callback: $.proxy(function(key, options) 
                 {
                    switch(key){
                    case "rename":
                        setTimeout(function(){
                            emitter.onDoubleClick();
                        },10);
                        break;
                    case "new":
                        setTimeout(function(){
                            _table.addEntity("_new_").onDoubleClick();
                        },10);
                        break;
                    case "delete":
                        // with undo/redo support
                        var cmd = new draw2d.command.CommandDelete(emitter);
                        emitter.getCanvas().getCommandStack().execute(cmd);
                    default:
                        break;
                    }
                 
                 },this),
                 x:event.x,
                 y:event.y,
                 items: 
                 {
                     "rename": {name: "Rename"},
                     "new":    {name: "New Entity"},
                     "sep1":   "---------",
                     "delete": {name: "Delete"}
                 }
             });
         });
         
	     if($.isNumeric(optionalIndex)){
             this.add(label, null, optionalIndex+1);
	     }
	     else{
	         this.add(label);
	     }

	     return label;
    },
    
    /**
     * @method
     * Remove the entity with the given index from the DB table shape.<br>
     * This method removes the entity without care of existing connections. Use
     * a draw2d.command.CommandDelete command if you want to delete the connections to this entity too
     * 
     * @param {Number} index the index of the entity to remove
     */
    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    /**
     * @method
     * Returns the entity figure with the given index
     * 
     * @param {Number} index the index of the entity to return
     */
    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },
     

     /**
      * @method
      * Set the name of the DB table. Visually it is the header of the shape
      * 
      * @param name
      */
     setName: function(name)
     {
         this.classLabel.setText(name);
         
         return this;
     },
     
     
     /**
      * @method 
      * Return an objects with all important attributes for XML or JSON serialization
      * 
      * @returns {Object}
      */
     getPersistentAttributes : function()
     {
         var memento= this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){
            
            if(i>0){ // skip the header of the figure
                memento.entities.push({
                    text:e.figure.getText(),
                    id: e.figure.id
                });
            }
        });
         
         return memento;
     },
     
     /**
      * @method 
      * Read all attributes from the serialized properties and transfer them into the shape.
      *
      * @param {Object} memento
      * @return
      */
     setPersistentAttributes : function(memento)
     {
         this._super(memento);
         
         this.setName(memento.name);

         if(typeof memento.entities !== "undefined"){
             $.each(memento.entities, $.proxy(function(i,e){
                 var entity =this.addEntity(e.text);
                 entity.id = e.id;
                 entity.getOutputPort(0).setName("output_"+e.id);
             },this));
         }

         return this;
     }  

});
////////////////////////////////////////////////  TRANSFORMADORES /////////////////////////////////////////////////////////
//// JOIN ////

transUnion = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "transUnion",
	
    init : function(attr)
    {
    	this._super($.extend({bgColor:"#dbddde", color:"#d7d7d7", stroke:1, radius:3},attr));
        
      
        this.classLabel = new draw2d.shape.basic.Label({
            text:"Unión", 
            stroke:1,
            fontColor:"#ffffff",  
            bgColor:"#71c7ec", 
            radius: this.getRadius(), 
            padding:10,
            resizeable:true,
            editor:new draw2d.ui.LabelInplaceEditor()
        });
        
        this.add(this.classLabel);
    },
     
    /**
     * @method
     * Add an entity to the db shape
     * 
     * @param {String} txt the label to show
     * @param {Number} [optionalIndex] index where to insert the entity
     */
    addEntity: function( optionalIndex)
    {
	   	 var label1 =new draw2d.shape.basic.Label({
	   	     text:"Principal",
	   	     stroke:0.2,
	   	     radius:0,
	   	     bgColor:"#ffffff",
	   	     padding:{left:10, top:3, right:10, bottom:5},
	   	     fontColor:"#107dac",
             resizeable:true,
             editor:new draw2d.ui.LabelEditor()
	   	 });

	   	 var label2 =new draw2d.shape.basic.Label({
            text:"Secundaria",
            stroke:0.2,
            radius:0,
            bgColor:"#ffffff",
            padding:{left:10, top:3, right:10, bottom:5},
            fontColor:"#107dac",
            resizeable:true,
         editor:new draw2d.ui.LabelEditor()
        });

        var label3 =new draw2d.shape.basic.Label({
            text:"Unión",
            stroke:0.2,
            radius:0,
            bgColor:"#ffffff",
            padding:{left:40, top:3, right:10, bottom:5},
            fontColor:"#107dac",
            resizeable:true,
         editor:new draw2d.ui.LabelEditor()
        });

        var label4 =new draw2d.shape.basic.Label({
            text:"Pr. sin usar",
            stroke:0.2,
            radius:0,
            bgColor:"#ffffff",
            padding:{left:40, top:3, right:10, bottom:5},
            fontColor:"#107dac",
            resizeable:true,
         editor:new draw2d.ui.LabelEditor()
        });

        var label5 =new draw2d.shape.basic.Label({
            text:"Sec. sin usar",
            stroke:0.2,
            radius:0,
            bgColor:"#ffffff",
            padding:{left:40, top:3, right:10, bottom:5},
            fontColor:"#107dac",
            resizeable:true,
         editor:new draw2d.ui.LabelEditor()
        });


        label1.installEditor(new draw2d.ui.LabelEditor());
         var input = label1.createPort("input");
         input.setName("input_"+label1.id);

         label2.installEditor(new draw2d.ui.LabelEditor());
         var input = label2.createPort("input");
         input.setName("input_"+label2.id);

         label3.installEditor(new draw2d.ui.LabelEditor());
	     var output= label3.createPort("output");
         output.setName("output_"+label3.id);

         label4.installEditor(new draw2d.ui.LabelEditor());
	     var output= label4.createPort("output");
         output.setName("output_"+label4.id);

         label5.installEditor(new draw2d.ui.LabelEditor());
	     var output= label5.createPort("output");
         output.setName("output_"+label5.id);
         
         var _table=this;
         label1.on("contextmenu", function(emitter, event){
             $.contextMenu({
                 selector: 'body', 
                 events:
                 {  
                     hide:function(){ $.contextMenu( 'destroy' ); }
                 },
                 callback: $.proxy(function(key, options) 
                 {
                    switch(key){
                    case "rename":
                        setTimeout(function(){
                            emitter.onDoubleClick();
                        },10);
                        break;
                    case "new":
                        setTimeout(function(){
                            _table.addEntity("_new_").onDoubleClick();
                        },10);
                        break;
                    case "delete":
                        // with undo/redo support
                        var cmd = new draw2d.command.CommandDelete(emitter);
                        emitter.getCanvas().getCommandStack().execute(cmd);
                    default:
                        break;
                    }
                 
                 },this),
                 x:event.x,
                 y:event.y,
                 items: 
                 {
                     "rename": {name: "Rename"},
                     "new":    {name: "New Entity"},
                     "sep1":   "---------",
                     "delete": {name: "Delete"}
                 }
             });
         });


         label2.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });

        label3.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });

        label4.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });

        label5.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });

	     if($.isNumeric(optionalIndex)){
             this.add(label1, null, optionalIndex+1);
             this.add(label2, null, optionalIndex+1);
             this.add(label3, null, optionalIndex+1);
             this.add(label4, null, optionalIndex+1);
             this.add(label5, null, optionalIndex+1);
	     }
	     else{
             this.add(label1);
             this.add(label2);
             this.add(label3);
             this.add(label4);
             this.add(label5);
	     }

	     return label1, label2, label3, label4, label5;
    },
    
    /**
     * @method
     * Remove the entity with the given index from the DB table shape.<br>
     * This method removes the entity without care of existing connections. Use
     * a draw2d.command.CommandDelete command if you want to delete the connections to this entity too
     * 
     * @param {Number} index the index of the entity to remove
     */
    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    /**
     * @method
     * Returns the entity figure with the given index
     * 
     * @param {Number} index the index of the entity to return
     */
    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },
     

     /**
      * @method
      * Set the name of the DB table. Visually it is the header of the shape
      * 
      * @param name
      */
     setName: function(name)
     {
         this.classLabel.setText(name);
         
         return this;
     },
     
     
     /**
      * @method 
      * Return an objects with all important attributes for XML or JSON serialization
      * 
      * @returns {Object}
      */
     getPersistentAttributes : function()
     {
         var memento= this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){
            
            if(i>0){ // skip the header of the figure
                memento.entities.push({
                    text:e.figure.getText(),
                    id: e.figure.id
                });
            }
        });
         
         return memento;
     },
     
     /**
      * @method 
      * Read all attributes from the serialized properties and transfer them into the shape.
      *
      * @param {Object} memento
      * @return
      */
     setPersistentAttributes : function(memento)
     {
         this._super(memento);
         
         this.setName(memento.name);

         if(typeof memento.entities !== "undefined"){
             $.each(memento.entities, $.proxy(function(i,e){
                 var entity =this.addEntity(e.text);
                 entity.id = e.id;
                 entity.getOutputPort(0).setName("output_"+e.id);
             },this));
         }

         return this;
     }  

});

//// Elimina Atributo ////

transElAtr = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "transElAtr",
	
    init : function(attr)
    {
    	this._super($.extend({bgColor:"#dbddde", color:"#d7d7d7", stroke:1, radius:3},attr));
        
      
        this.classLabel = new draw2d.shape.basic.Label({
            text:"Elimina Atributo", 
            stroke:1,
            fontColor:"#ffffff",  
            bgColor:"#71c7ec", 
            radius: this.getRadius(), 
            padding:10,
            resizeable:true,
            editor:new draw2d.ui.LabelInplaceEditor()
        });
        
        this.add(this.classLabel);
    },
     
    /**
     * @method
     * Add an entity to the db shape
     * 
     * @param {String} txt the label to show
     * @param {Number} [optionalIndex] index where to insert the entity
     */
    addEntity: function( optionalIndex)
    {
	   	 var label1 =new draw2d.shape.basic.Label({
	   	     text:"Input",
	   	     stroke:0.2,
	   	     radius:0,
	   	     bgColor:"#ffffff",
	   	     padding:{left:10, top:3, right:10, bottom:5},
	   	     fontColor:"#107dac",
             resizeable:true,
             editor:new draw2d.ui.LabelEditor()
	   	 });

	   	 var label2 =new draw2d.shape.basic.Label({
            text:"Output",
            stroke:0.2,
            radius:0,
            bgColor:"#ffffff",
            padding:{left:40, top:3, right:10, bottom:5},
            fontColor:"#107dac",
            resizeable:true,
         editor:new draw2d.ui.LabelEditor()
        });


        label1.installEditor(new draw2d.ui.LabelEditor());
         var input = label1.createPort("input");
         input.setName("input_"+label1.id);

         label2.installEditor(new draw2d.ui.LabelEditor());
	     var output= label2.createPort("output");
         output.setName("output_"+label2.id);
         
         var _table=this;
         label1.on("contextmenu", function(emitter, event){
             $.contextMenu({
                 selector: 'body', 
                 events:
                 {  
                     hide:function(){ $.contextMenu( 'destroy' ); }
                 },
                 callback: $.proxy(function(key, options) 
                 {
                    switch(key){
                    case "rename":
                        setTimeout(function(){
                            emitter.onDoubleClick();
                        },10);
                        break;
                    case "new":
                        setTimeout(function(){
                            _table.addEntity("_new_").onDoubleClick();
                        },10);
                        break;
                    case "delete":
                        // with undo/redo support
                        var cmd = new draw2d.command.CommandDelete(emitter);
                        emitter.getCanvas().getCommandStack().execute(cmd);
                    default:
                        break;
                    }
                 
                 },this),
                 x:event.x,
                 y:event.y,
                 items: 
                 {
                     "rename": {name: "Rename"},
                     "new":    {name: "New Entity"},
                     "sep1":   "---------",
                     "delete": {name: "Delete"}
                 }
             });
         });


        label2.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });


	     if($.isNumeric(optionalIndex)){
             this.add(label1, null, optionalIndex+1);
             this.add(label2, null, optionalIndex+1);
	     }
	     else{
             this.add(label1);
             this.add(label2);
	     }

	     return label1, label2;
    },
    
    /**
     * @method
     * Remove the entity with the given index from the DB table shape.<br>
     * This method removes the entity without care of existing connections. Use
     * a draw2d.command.CommandDelete command if you want to delete the connections to this entity too
     * 
     * @param {Number} index the index of the entity to remove
     */
    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    /**
     * @method
     * Returns the entity figure with the given index
     * 
     * @param {Number} index the index of the entity to return
     */
    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },
     

     /**
      * @method
      * Set the name of the DB table. Visually it is the header of the shape
      * 
      * @param name
      */
     setName: function(name)
     {
         this.classLabel.setText(name);
         
         return this;
     },
     
     
     /**
      * @method 
      * Return an objects with all important attributes for XML or JSON serialization
      * 
      * @returns {Object}
      */
     getPersistentAttributes : function()
     {
         var memento= this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){
            
            if(i>0){ // skip the header of the figure
                memento.entities.push({
                    text:e.figure.getText(),
                    id: e.figure.id
                });
            }
        });
         
         return memento;
     },
     
     /**
      * @method 
      * Read all attributes from the serialized properties and transfer them into the shape.
      *
      * @param {Object} memento
      * @return
      */
     setPersistentAttributes : function(memento)
     {
         this._super(memento);
         
         this.setName(memento.name);

         if(typeof memento.entities !== "undefined"){
             $.each(memento.entities, $.proxy(function(i,e){
                 var entity =this.addEntity(e.text);
                 entity.id = e.id;
                 entity.getOutputPort(0).setName("output_"+e.id);
             },this));
         }

         return this;
     }  

});

////////////////////////////////////////////////  SALIDAS /////////////////////////////////////////////////////////

//// OUTPUT POSTGRESQL ////

outputPostgresql = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "outputPostgresql",
	
    init : function(attr)
    {
    	this._super($.extend({bgColor:"#dbddde", color:"#d7d7d7", stroke:1, radius:3},attr));
        
      
        this.classLabel = new draw2d.shape.basic.Label({
            text:"PostgreSQL", 
            stroke:1,
            fontColor:"#ffffff",  
            bgColor:"#e8ca93", 
            radius: this.getRadius(), 
            padding:10,
            resizeable:true,
            editor:new draw2d.ui.LabelInplaceEditor()
        });
       
        
        this.add(this.classLabel);
    },
     
    /**
     * @method
     * Add an entity to the db shape
     * 
     * @param {String} txt the label to show
     * @param {Number} [optionalIndex] index where to insert the entity
     */
    addEntity: function(optionalIndex)
    {
	   	 var label =new draw2d.shape.basic.Label({
	   	     text:"Output",
	   	     stroke:0.2,
	   	     radius:0,
	   	     bgColor:"#ffffff",
	   	     padding:{left:10, top:3, right:40, bottom:5},
	   	     fontColor:"#9a8262",
	   	     resizeable:true,
             editor:new draw2d.ui.LabelEditor()
	   	 });

        label.installEditor(new draw2d.ui.LabelEditor());

	     var input= label.createPort("input");
	     

         input.setName("input_"+label.id);
         
         var _table=this;
         label.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });
         
	     if($.isNumeric(optionalIndex)){
             this.add(label, null, optionalIndex+1);
	     }
	     else{
	         this.add(label);
	     }

	     return label;
    },
    
    /**
     * @method
     * Remove the entity with the given index from the DB table shape.<br>
     * This method removes the entity without care of existing connections. Use
     * a draw2d.command.CommandDelete command if you want to delete the connections to this entity too
     * 
     * @param {Number} index the index of the entity to remove
     */
    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    /**
     * @method
     * Returns the entity figure with the given index
     * 
     * @param {Number} index the index of the entity to return
     */
    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },

     /**
      * @method
      * Set the name of the DB table. Visually it is the header of the shape
      * 
      * @param name
      */
     setName: function(name)
     {
         this.classLabel.setText(name);
         
         return this;
     },
     
     /**
      * @method 
      * Return an objects with all important attributes for XML or JSON serialization
      * 
      * @returns {Object}
      */
     getPersistentAttributes : function()
     {
         var memento= this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){
            
            if(i>0){ // skip the header of the figure
                memento.entities.push({
                    text:e.figure.getText(),
                    id: e.figure.id
                });
            }
        });
         
         return memento;
     },
     
     /**
      * @method 
      * Read all attributes from the serialized properties and transfer them into the shape.
      *
      * @param {Object} memento
      * @return
      */
     setPersistentAttributes : function(memento)
     {
         this._super(memento);
         
         this.setName(memento.name);

         if(typeof memento.entities !== "undefined"){
             $.each(memento.entities, $.proxy(function(i,e){
                 var entity =this.addEntity(e.text);
                 entity.id = e.id;
                 entity.getOutputPort(0).setName("output_"+e.id);
             },this));
         }

         return this;
     }  

});

//// OUTPUT POSTGIS ////

outputPostgis = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "outputPostgis",
	
    init : function(attr)
    {
    	this._super($.extend({bgColor:"#dbddde", color:"#d7d7d7", stroke:1, radius:3},attr));
        
      
        this.classLabel = new draw2d.shape.basic.Label({
            text:"PostGIS", 
            stroke:1,
            fontColor:"#ffffff",  
            bgColor:"#e8ca93", 
            radius: this.getRadius(), 
            padding:10,
            resizeable:true,
            editor:new draw2d.ui.LabelInplaceEditor()
        });
       
        
        this.add(this.classLabel);
    },
     
    /**
     * @method
     * Add an entity to the db shape
     * 
     * @param {String} txt the label to show
     * @param {Number} [optionalIndex] index where to insert the entity
     */
    addEntity: function(optionalIndex)
    {
	   	 var label =new draw2d.shape.basic.Label({
	   	     text:"Output",
	   	     stroke:0.2,
	   	     radius:0,
	   	     bgColor:"#ffffff",
	   	     padding:{left:10, top:3, right:40, bottom:5},
	   	     fontColor:"#9a8262",
	   	     resizeable:true,
             editor:new draw2d.ui.LabelEditor()
	   	 });

        label.installEditor(new draw2d.ui.LabelEditor());

	     var input= label.createPort("input");
	     

         input.setName("input_"+label.id);
         
         var _table=this;
         label.on("contextmenu", function(emitter, event){
            $.contextMenu({
                selector: 'body', 
                events:
                {  
                    hide:function(){ $.contextMenu( 'destroy' ); }
                },
                callback: $.proxy(function(key, options) 
                {
                   switch(key){
                   case "rename":
                       setTimeout(function(){
                           emitter.onDoubleClick();
                       },10);
                       break;
                   case "new":
                       setTimeout(function(){
                           _table.addEntity("_new_").onDoubleClick();
                       },10);
                       break;
                   case "delete":
                       // with undo/redo support
                       var cmd = new draw2d.command.CommandDelete(emitter);
                       emitter.getCanvas().getCommandStack().execute(cmd);
                   default:
                       break;
                   }
                
                },this),
                x:event.x,
                y:event.y,
                items: 
                {
                    "rename": {name: "Rename"},
                    "new":    {name: "New Entity"},
                    "sep1":   "---------",
                    "delete": {name: "Delete"}
                }
            });
        });
         
	     if($.isNumeric(optionalIndex)){
             this.add(label, null, optionalIndex+1);
	     }
	     else{
	         this.add(label);
	     }

	     return label;
    },
    
    /**
     * @method
     * Remove the entity with the given index from the DB table shape.<br>
     * This method removes the entity without care of existing connections. Use
     * a draw2d.command.CommandDelete command if you want to delete the connections to this entity too
     * 
     * @param {Number} index the index of the entity to remove
     */
    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    /**
     * @method
     * Returns the entity figure with the given index
     * 
     * @param {Number} index the index of the entity to return
     */
    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },

     /**
      * @method
      * Set the name of the DB table. Visually it is the header of the shape
      * 
      * @param name
      */
     setName: function(name)
     {
         this.classLabel.setText(name);
         
         return this;
     },
     
     /**
      * @method 
      * Return an objects with all important attributes for XML or JSON serialization
      * 
      * @returns {Object}
      */
     getPersistentAttributes : function()
     {
         var memento= this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){
            
            if(i>0){ // skip the header of the figure
                memento.entities.push({
                    text:e.figure.getText(),
                    id: e.figure.id
                });
            }
        });
         
         return memento;
     },
     
     /**
      * @method 
      * Read all attributes from the serialized properties and transfer them into the shape.
      *
      * @param {Object} memento
      * @return
      */
     setPersistentAttributes : function(memento)
     {
         this._super(memento);
         
         this.setName(memento.name);

         if(typeof memento.entities !== "undefined"){
             $.each(memento.entities, $.proxy(function(i,e){
                 var entity =this.addEntity(e.text);
                 entity.id = e.id;
                 entity.getOutputPort(0).setName("output_"+e.id);
             },this));
         }

         return this;
     }  

});