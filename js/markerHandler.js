var userNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function () {
    if (userNumber === null) {
      this.askuserNumber();
    }

    var toys = await this.getToys();

    this.el.addEventListener("markerFound", () => {
      if (userNumber !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(toys, markerId);
      }
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },

  askuserNumber: function () {
    var iconUrl = "https://raw.githubusercontent.com/CDhivyaBharathi/toy-assets/main/Assets/photo-icon.png";
    
    Swal({
      title: 'Welcome to Toy Factory!!',
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your uid",
          type: "number",
          min: 1
        }
      }
    }).then(inputValue => {
      userNumber = inputValue;
    });
  },

  handleMarkerFound: function (toys, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    // Sunday - Saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];
    var day = days[todaysDay]
    console.log(day)

    // Changing Model scale to initial scale
    var toy = toys.filter(toy => toy.id === markerId)[0];
    console.log(toy.id)


      // make model visible
      var model = document.querySelector(`#model-${toy.id}`);

      model.setAttribute("visible", true);

      // make ingredients Container visible
      var ingredientsContainer = document.querySelector(
        `#main-plane-${toy.id}`
      );
      ingredientsContainer.setAttribute("visible", true);

      // make Price Plane visible
      var pricePlane = document.querySelector(`#price-plane-${toy.id}`);
      pricePlane.setAttribute("visible", true);

      // make Rating Plane visible
      var ratingPlane = document.querySelector(`#rating-plane-${toy.id}`);
      ratingPlane.setAttribute("visible", true);
      

      // make review Plane visible
      var reviewPlane = document.querySelector(`#review-plane-${toy.id}`);
      reviewPlane.setAttribute("visible", true);

      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButton = document.getElementById("order-button");
      var orderSummaryButton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button");

      // Handling Click Events
      ratingButton.addEventListener("click", () => this.handleRatings(toy));

      orderButton.addEventListener("click", () => {
        var uNumber;
        userNumber <= 9 ? (uNumber = `U0${userNumber}`) : `U${userNumber}`;
        this.handleOrder(uNumber, toy);

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "Your order will soon be delieverd!",
          timer: 2000,
          buttons: false
        });
      });

      orderSummaryButton.addEventListener("click", () =>
        this.handleOrderSummary()
      );

      payButton.addEventListener("click", () => this.handlePayment());
  },
  handleOrder: function (uNumber, toy) {
    // Reading currnt table order details

    firebase
      .firestore()
      .collection("user_id")
      .doc(uNumber)
      .get()
      .then(doc => {
        var details = doc.data();
        console.log(details)
        
        if (details["current_orders"][toy.id]) {
          // Increasing Current Quantity
          details["current_orders"][toy.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][toy.id]["quantity"];

          details["current_orders"][toy.id]["subtotal"] =
            currentQuantity * toy.price;
        } else {
          details["current_orders"][toy.id] = {
            item: toy.toy_name,
            price: toy.price,
            quantity: 1,
            subtotal: toy.price * 1  
          };
        }

        details.total_bill += toy.price;

        // Updating Db
        firebase
          .firestore()
          .collection("user_id")
          .doc(uNumber)
          .update(details);
      });
  },
  getToys: async function () {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  getOrderSummary: async function (uNumber) {
    return await firebase
      .firestore()
      .collection("user_id")
      .doc(uNumber)
      .get()
      .then(doc => doc.data());
  },
  handleOrderSummary: async function () {
    // Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    var tableBodyTag = document.getElementById("bill-table-body");

    // Removing old tr data
    tableBodyTag.innerHTML = "";

    // Getting Table Number
    var uNumber;
    userNumber <= 9 ? (uNumber = `T0${userNumber}`) : `T${userNumber}`;

    // Getting Order Summary from database
    var orderSummary = await this.getOrderSummary(uNumber);

    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {
      var tr = document.createElement("tr");
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.current_orders[i].item;
      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);
      tableBodyTag.appendChild(tr);
    });

    var totalTr = document.createElement("tr");

    var td1 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td2 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td3 = document.createElement("td");
    td1.setAttribute("class", "no-line text-cente");

    var strongTag = document.createElement("strong");
    strongTag.innerHTML = "Total";
    td3.appendChild(strongTag);

    var td4 = document.createElement("td");
    td1.setAttribute("class", "no-line text-right");
    td4.innerHTML = "$" + orderSummary.total_bill;

    totalTr.appendChild(td1);
    totalTr.appendChild(td2);
    totalTr.appendChild(td3);
    totalTr.appendChild(td4);

    tableBodyTag.appendChild(totalTr);
  },
  handlePayment: function () {
    // Close Modal
    document.getElementById("modal-div").style.display = "none";

    // Getting Table Number
    var uNumber;
    userNumber <= 9 ? (uNumber = `T0${userNumber}`) : `T${userNumber}`;

    // Reseting current orders and total bill
    firebase
      .firestore()
      .collection("tables")
      .doc(uNumber)
      .update({
        current_orders: {},
        total_bill: 0
      })
      .then(() => {
        swal({
          icon: "success",
          title: "Thanks For Paying !",
          text: "Hope you like the item !!",
          timer: 2500,
          buttons: false
        });
      });
  },

  handleRatings: async function (toy) {
    var uNumber;
    userNumber <= 9 ? (uNumber = `U0${userNumber}`) : `U${userNumber}`;

    // Getting Order Summary from database
    var orderSummary = await this.getOrderSummary(uNumber);

    var currentOrders = Object.keys(orderSummary.current_orders);

    if(currentOrders.length > 0 & currentOrders == toy.id){
      document.getElementById("rating-modal-div").style.display="flex"
      document.getElementById("rating-input").value = "0"
      document.getElementById("feedback-input").value = ""
      
      var saveRatingButton = document.getElementById("save-rating-button")
      
      saveRatingButton.addEventListener("click",()=>{
        document.getElementById("rating-modal-div").style.display="none"
        var rating = document.getElementById("rating-input").value;
        var feedback = document.getElementById("feedback-input").value;

        firebase.firestore().collection("toys").doc(toy.id).update({
          last_review : feedback,
          last_rating : rating
        }).then(()=>{
          swal({
            icon: "success",
              title: "Thanks For Rating!",
              text: "We Hope You Like toy !!",
              timer: 2500,
              buttons: false
          })
        })
      })
    }else{
      swal({
        icon: "warning",
        title: "Oops!",
        text: "No toy found to give ratings!!",
        timer: 2500,
        buttons: false
      });
    }
  },
  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
