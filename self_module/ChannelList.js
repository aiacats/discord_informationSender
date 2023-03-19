
const fs = require("fs");

class ChannelList{
    
    constructor(){
        this.list = new Array();
    }

    WriteChannel(channel){
        this.list.push(channel);      
        this.WriteJsonList();
    }

    RemoveChannel(index){
        this.list.splice(index, 1);
        this.WriteJsonList();
    }

    ReadJsonList(){
        var parseData = JSON.parse(fs.readFileSync("channelList.json", "utf-8"));
        this.list = parseData;
        return this.list;
    }

    WriteJsonList(){
        var jsonData = JSON.stringify(this.list, null, 2);
        fs.writeFile("channelList.json", jsonData, (err) => {
            if(err) throw err;
            console.log("Successfully written.")
        });
    }
}

module.exports = new ChannelList();

