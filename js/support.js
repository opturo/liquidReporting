/**
 * Created by rocco on 9/13/2018.
 * This is the support section of ODIN Lite.
 * This will handle everything to do with support.
 */
var odinLite_support = {

    /**
     * testing
     * FOR TESTING ONLY
     */
    testing: function(){
        odinLite_support.getOpenIssues();
    },

    init: function(){
        $('#li_accountSettings_support').show();
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.support.initSupport'
            },
            function(data, status){

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure retrieving support:", data.message);
                }else{
                    via.debug("Successful retrieving support:", data);

                    //DD List - Categories
                    var requestList = [];
                    $.each(data.requestTypes,function(key,value){
                        requestList.push({
                            text: key,
                            value: value
                        });
                    });
                    $("#accountSettings_support_category").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: requestList,
                        optionLabel: "",
                        change: function(e){
                            //var category = e.sender.value();
                        }
                    });

                    //DD List - Applications
                    var appList = [];
                    $.each(data.applications,function(key,value){
                        appList.push({
                            text: value,
                            value: value
                        });
                    });
                    $("#accountSettings_support_application").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: appList,
                        optionLabel: "",
                        change: function(e){
                            //var app = e.sender.text();
                        }
                    });

                    //Style the file boxes
                    $("#accountSettings_support_attachments").kendoUpload({
                        multiple: true,
                        localization: {
                            select: "Select a file to upload..."
                        }
                    });

                    /* Submit the form */
                    $("#accountSettings_support_form").submit(function(e) {
                        e.preventDefault();

                        var formData = new FormData($(this)[0]);
                        odinLite_support.createSupportTicket(formData);
                    });
                }
            },
            'json');
    },

    createSupportTicket: function(formData){
        //Check for required values
        if(via.undef(formData.get("summary"),true)){
            via.kendoAlert("Support Submit Error","Please provide a summary.");
            return;
        }
        if(via.undef(formData.get("application"),true)){
            via.kendoAlert("Support Submit Error","Please provide an application.");
            return;
        }
        if(via.undef(formData.get("category"),true)){
            via.kendoAlert("Support Submit Error","Please provide a category.");
            return;
        }
        if(via.undef(formData.get("description"),true)){
            via.kendoAlert("Support Submit Error","Please provide a description.");
            return;
        }

        //Add the specific action
        formData.append('action','odinLite.support.createSupportRequest');

        kendo.ui.progress($("body"), true);

        //Make the call to the run.
        $.ajax({
            url: odin.SERVLET_PATH,
            type: 'POST',
            data: formData,
            async: true,
            cache: false,
            contentType: false,
            processData: false,
            dataType: 'json',
            success: function (data) {
                kendo.ui.progress($("body"), false);

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Support Form Failure:", data.message);
                    via.alert("Support Submit Error",data.message);
                }else{
                    via.debug("Support Form Success:", data.message);

                    var attachTxt = "";
                    if(!via.undef(data.numAttachments) && data.numAttachments > 0){
                        attachTxt = "<br>Uploaded " + data.numAttachments + " attachment(s).";
                    }
                    via.alert("Support Submit Success","Support Ticket Submitted.<br>Ticket reference #: " + data.issueKey + attachTxt,function(){
                        //Reset the form
                        $('#accountSettings_support_attachments').data('kendoUpload').removeAllFiles();
                        $('#accountSettings_support_description').val(null);
                        $('#accountSettings_support_summary').val(null);
                        $('#accountSettings_support_category').data('kendoDropDownList').select(0);
                        $('#accountSettings_support_application').data('kendoDropDownList').select(0);
                    });
                }
            }
        });
    },

    getOpenIssues: function(){

        kendo.ui.progress($("body"), true);
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.support.getOpenIssues'
            },
            function(data, status){
                kendo.ui.progress($("body"), false);
                console.log('getOpenIssues',data);

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure getting issues:", data.message);
                }else{
                    via.debug("Successful getting issues:", data);
                }
            },
            'json');
    }
};