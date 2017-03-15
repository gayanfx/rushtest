/*
	Product: Virtual Spaces Server
	Version: 1.0.0
	Developer: DesignSkate
*/

/************************************************************************************************/

/*
	To modify the server port (on which your virtual spaces software will run),
	modify the following line! Be sure to update the client scripts to reflect the new port.
*/
var VS_SERVER_PORT = 1223;

/*
	To modify the server's secret password for your admin application,
	modify the following line! (THIS SHOULD BE CHANGED FROM THE DEFAULT)
*/
var VS_ADMIN_SECRET = "devans123";

/*
	To modify the maximum number of clients allowed to chat at any one time,
	modify the following line!
*/
var VS_MAX_CLIENTS = 2;

/*
	The file name (excluding extension) of the default sprite sheet should no sheet be selected by
	the client. Also used if the client attempts to use an invalid sprite sheet.
*/
var DEFAULT_SPRITE = "male_sheet";

/*
	Rooms are defined on the server side and fed to the clients, define your rooms below.
	Read the rooms documentation file to learn how room background images work.
	
	Creating new rooms must be done on the server script, then restarted to take effect on the client. 
	Rooms must be defined in both "Rooms" and "RoomConfig". The map_id should reflect the value in the Rooms variable.
	Copy the existing setup to add new rooms to your chat room.
	
	- map_id should relate to the ID defined in "Rooms"
	- map_name is a pretty name for your chat room
	- map_coordinates contains the room boundaries, see our rooms documentation for more info
	- max_clients is the number of avatars allowed in that room at any one time
	- entry_x is the X (left) default position of the avatar
	- entry_y is the Y (top) default position of the avatar
*/




//This is the statring point of the new generation social networks. V meetups already have more than 1.2 million users and we are expecting more after they can use the VR headset



var yearStart = 1;
var yearEnd = 100;
var Rooms = [];
var RoomConfig = []; 

for (var i = yearStart; i < yearEnd+1; )
 {
	
	
Rooms.push(""+ i +"");

	RoomConfig.push({map_id:""+ i +"",'map_name':""+ i +"",'map_coordinates': '16, 404, 259, 248, 308, 251, 383, 202, 440, 168, 499, 201, 425, 243, 624, 353, 755, 317, 860, 373, 848, 598, 522, 598, 36, 536','max_clients': '25','entry_x': '190','entry_y': '120'});
	
	
	i++;
	
}



/*

var Rooms = ["map"];
var RoomConfig = [
                {
					'map_id':'map',
                    'map_name':'map',
            'map_coordinates': '2, 253, 87, 180, 79, 138, 53, 99, 12, 65, 38, 15, 178, 118, 237, 114, 315, 105, 384, 55, 497, 111, 565, 141, 714, 43, 788, 86, 649, 177, 889, 318, 736, 451, 757, 509, 884, 586, 829, 627, 720, 612, 667, 568, 630, 560, 519, 636, 499, 583, 6, 502',
					'max_clients': '50',
					'entry_x': '60',
					'entry_y': '0'
                }
				
		
             ];
			 
	
			
			 
			 

	Define a list of VALID sprite sheets for the server to check, these are 
	not sent to the client side. See documentation on adding new avatars.
*/
var ValidSprites = ["male_sheet", "test_sheet", "male_sheet2", "female_sheet"];
			 
/************************************************************************************************/

/*
	****************
	No configuration code below
	****************
*/
var io = require("socket.io");
var socket = io.listen(VS_SERVER_PORT, {secure: true});






var VS_Avatars = [];
var AvatarData = {};
var vcSocketKey = Math.random().toString(36).substr(2); // token will be used to restrict access should the server quit
var ServerData = {"ROOM_LIST" : Rooms, "ROOM_CONFIG" : RoomConfig, "SOCKET_KEY" : vcSocketKey, "DEFAULT_SPRITE" : DEFAULT_SPRITE};
//var ServerData = {"ROOM_LIST" : Rooms, "ROOM_CONFIG" : RoomConfig, "SOCKET_KEY" : vcSocketKey, "DEFAULT_SPRITE" : DEFAULT_SPRITE};




console.log("vmeetup: Successfully started!");

socket.on("connection", function (client) {
	var VS_CLIENT_ID = null;
	AvatarData[client.id] = {"active" : "no", "room" : "purgatory"};
	
	/*
		Client requests a server connection
	*/
	client.on("VS_RequestJoin", function(isAdmin, AdminKey)
	{
		if (!isAdmin)
		{
			var VS_NUM_CLIENTS = 0;
			for (var id in VS_Avatars)
				VS_NUM_CLIENTS++;
				
			if (VS_NUM_CLIENTS >= VS_MAX_CLIENTS)
			{
				client.emit("VS_Dialog", "MAX CLIENTS REACHED");
			}
			else
			{
				VS_CLIENT_ID = "client" + Math.floor((Math.random() * 5000) + 1);
				
				for (var id in VS_Avatars)
					if (VS_Avatars[id] == VS_CLIENT_ID)
					{
						VS_CLIENT_ID = VS_CLIENT_ID + "_";
					}
				
				VS_Avatars[client.id] = VS_CLIENT_ID;
				AvatarData[client.id] = {"id" : VS_CLIENT_ID, "nickname" : "not set", "room" : "purgatory", "posX" : "0", "posY" : "0", "active" : "no"};
				
				client.emit("VS_Connection", ServerData);
			}
		}
		else
		{
			if (AdminKey == VS_ADMIN_SECRET)
			{
				AvatarData[client.id] = {"id" : VS_CLIENT_ID, "IsAdmin" : true};
				client.emit("VS_AdminConnect", 1);
				
				/*
					Transmit some data to the admin client
				*/
				var TOTAL_CLIENTS = 0;
				for (var id in VS_Avatars)
					client.emit("VS_ClientList", AvatarData[id]["id"], AvatarData[id]["nickname"], AvatarData[id]["room"]);
					TOTAL_CLIENTS++;
					
				client.emit("VS_AdminData", TOTAL_CLIENTS);
			}
			else
			{
				client.emit("VS_AdminConnect", 0);
			}
		}
	});
	
	/*
		--- ADMIN 
		Requests client list
	*/
	client.on("VS_RequestClients", function(socketkey)
	{
		if (socketkey == VS_ADMIN_SECRET)
		{
			if (AvatarData[client.id]["IsAdmin"] == true)
			{
				for (var id in VS_Avatars)
					client.emit("VS_ClientList", AvatarData[id]["id"], AvatarData[id]["nickname"], AvatarData[id]["room"]);		
			}
			else
			{
				console.log("Client is not admin");
			}
		}
		else
		{
			console.log("Invalid socket key");
		}
	});
	
	/*
		--- ADMIN 
		Requests remove client
	*/
	client.on("VS_RemoveClient", function(socketkey, kickclient)
	{
		if (socketkey == VS_ADMIN_SECRET)
		{
			if (AvatarData[client.id]["IsAdmin"] == true)
			{
				socket.sockets.emit("VS_Notify", 1, kickclient);
				
				for (var id in VS_Avatars)
					if (AvatarData[id]["id"] == kickclient)
						AvatarData[id] = {"id" : "kicked", "nickname" : "kicked", "room" : "kicked", "posX" : "0", "posY" : "0", "active" : "no", "kicked" : "yes"};
			}
			else
			{
				console.log("Client is not admin");
			}
		}
		else
		{
			console.log("Invalid socket key");
		}
	});
	
	/*
		Client is quitting a chat room
	*/
	client.on("VS_LeaveRoom", function(requestrooms, socketkey)
	{
		if (socketkey == vcSocketKey)
		{
			if (AvatarData[client.id]["kicked"] != "yes")
			{
				var CURRENT_ROOM = AvatarData[client.id]["room"];
				socket.sockets.emit("VS_AnnounceLeave", AvatarData[client.id]["id"], CURRENT_ROOM);
				
				AvatarData[client.id] = {"id" : VS_CLIENT_ID, "nickname" : AvatarData[client.id]["nickname"], "room" : "purgatory", "posX" : "250", "posY" : "250", "active" : "no"};
				
				if (requestrooms != 0)
				{
					client.emit("VS_GotoRooms");
				}
			}
		}
		else
		{
			console.log("Invalid socket key");
		}
	});
	
	/*
		Client is requesting to login to a chat room
	*/
	client.on("VS_JoinRoom", function(nickname, joinroom, socketkey, spritesheet)
	{
		if (socketkey == vcSocketKey)
		{
			if (AvatarData[client.id]["kicked"] != "yes")
			{
				if (Rooms.indexOf(joinroom) != -1)
				{
					var ROOM_COUNT = 0;
					for (var id in VS_Avatars)
						if (AvatarData[id]["room"] == joinroom)
							ROOM_COUNT++;
						
					var MAX_CLIENTS;
					var ROOM_X;
					var ROOM_Y;
					for(var i = 0; i < RoomConfig.length; i++) {
					   if(RoomConfig[i].map_id === joinroom) {
						  MAX_CLIENTS = RoomConfig[i].max_clients;
						  ROOM_X = RoomConfig[i].entry_x;
						  ROOM_Y = RoomConfig[i].entry_y;
					   }
					}
						
					if (ROOM_COUNT < MAX_CLIENTS)
					{
						//clean_nick = nickname.replace(/[^a-z0-9]/gi,'');
							clean_nick = nickname;
						clean_room = joinroom.replace(/[^a-z0-9]/gi,'');
						
						if (clean_nick.length < 1)
							clean_nick = "guest";
						
							for (var id in VS_Avatars) // prevent duplicate names in the chat
								if (AvatarData[id]["nickname"] == clean_nick && AvatarData[client.id] != AvatarData[id])
									clean_nick = clean_nick + "_" + Math.floor((Math.random() * 200) + 1)
									short_nick = clean_nick.substr(0, 20)
						
						var SPRITE_SHEET = spritesheet.replace(/[^a-z0-9_]/gi,'');
						var use_sheet = DEFAULT_SPRITE;
						if (ValidSprites.indexOf(SPRITE_SHEET) != -1)
						{
							use_sheet = SPRITE_SHEET;
						}
						
						AvatarData[client.id] = {"id" : VS_CLIENT_ID, "nickname" : short_nick, "room" : clean_room, "posX" : ROOM_X, "posY" : ROOM_Y, "active" : "yes", "spritesheet" : use_sheet};

						client.emit("VS_RoomJoin", VS_CLIENT_ID, short_nick, clean_room, ROOM_X, ROOM_Y);
						socket.sockets.emit("VS_LoadAvatars", AvatarData);
					}
					else
					{
						client.emit("VS_Dialog", "The room is full");
					}
				}
			}
		}
		else
		{
			console.log("Invalid socket key");
		}
	});
	
	/*
		Client has moved their avatar
	*/
	client.on("VS_UpdatePosition", function(xPosition, yPosition, socketkey)
	{
		if (socketkey == vcSocketKey)
		{
			if (AvatarData[client.id]["kicked"] != "yes")
			{
				if (!isNaN(parseFloat(xPosition) && !isNaN(parseFloat(yPosition))))
				{
					AvatarData[client.id]["posX"] = xPosition;
					AvatarData[client.id]["posY"] = yPosition;
					
					socket.sockets.emit("VS_UpdatePositions", AvatarData[client.id]["id"], AvatarData[client.id]["room"], xPosition, yPosition);
				}
			}
		}
		else
		{
			console.log("Invalid socket key");
		}
	});
	
	/*
		Client has sent a chat message
	*/
	client.on("VS_SendChat", function(message, socketkey)
	{
		if (socketkey == vcSocketKey)
		{
			if (AvatarData[client.id]["kicked"] != "yes")
			{
				var ChatMsg = message;
				var VC_ChatMsg = ChatMsg.replace(/(<([^>]+)>)/ig, '');
				var limitLen = VC_ChatMsg.toLowerCase(VC_ChatMsg.substring(0, 30));

				socket.sockets.emit("VS_ReceiveChat", AvatarData[client.id]["id"], AvatarData[client.id]["room"], limitLen, AvatarData[client.id]["nickname"]);
			}
		}
		else
		{
			console.log("Invalid socket key");
		}	
	});
	
	/*
		Client requests room data
	*/
	client.on("VS_RequestRoomInfo", function(roomid, socketkey)
	{
		if (socketkey == vcSocketKey)
		{
			if (AvatarData[client.id]["kicked"] != "yes")
			{
				var ROOM_COUNT = 0;
				for (var id in VS_Avatars)
					if (AvatarData[id]["room"] == roomid)
						ROOM_COUNT++;
						
				var ROOM_COORDINATES;
				var ROOM_TITLE;
				var ROOM_ID;
				var MAX_CLIENTS;
				for(var i = 0; i < RoomConfig.length; i++) {
				   if(RoomConfig[i].map_id === roomid) {
					  ROOM_COORDINATES = RoomConfig[i].map_coordinates;
					 ROOM_TITLE = RoomConfig[i].map_name;
					ROOM_ID = RoomConfig[i].map_id;
				
				ROOM_ID = RoomConfig[i].map_id;
					  MAX_CLIENTS = RoomConfig[i].max_clients;
				   }
				}
					
				client.emit("VS_AddRoom", ROOM_TITLE, ROOM_ID, ROOM_COUNT, ROOM_COORDINATES, MAX_CLIENTS);
			}
		}
		else
		{
			console.log("Invalid socket key");
		}
	});

	/*
		Client has quit
	*/
	client.on("disconnect", function()
	{
		socket.sockets.emit("VC_ClientDisconnect", AvatarData[client.id]["id"]);
		
		delete VS_Avatars[client.id];
		delete AvatarData[client.id];
	});
});