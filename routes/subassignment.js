var express = require("express");
var router = express.Router({mergeParams: true});
var User = require("../models/user");
var Course = require("../models/course");
var middleware =require("../middleware");
var Assignment = require("../models/assignment");
var Subassignment = require("../models/subassignment");

//CREATE subassignment route
router.post("/", middleware.checkCorrectUser, function(req, res) {
    var subassignment = req.body.subassignment;
    Subassignment.create(subassignment, function(err, newSubassignment) {
        if(err){
            req.flash("error", "Couldn't add subassignment, please try again");
            res.redirect("/user/"+req.params.userid+"/course/"+req.params.courseid);
        }
        else{
            //find the course and push the assignment in
            Assignment.findById(req.params.assignmentid).populate('subassignments').exec(function(err, foundAssignment) {
                if(err){
                    //if there's an error, go back to editing
                    req.flash("error", "couldn't find parent assignment in database");
                    res.redirect("/user/"+req.params.userid+"/course/"+req.params.courseid);
                }
                else{
                    foundAssignment.subassignments.push(newSubassignment);
                    foundAssignment.save();
                    //send the course back to ajax so that they can use the information to update the view
                    res.json(newSubassignment);
                }
            });
        }
    });
});

//UPDATE subassignment route
router.put("/:subassignmentId", middleware.checkCorrectUser, function(req, res){
    Subassignment.findByIdAndUpdate(req.params.subassignmentId, req.body.subassignment, {new: true}, function(err, updated){
        if(err){
            req.flash("error", "Error updating");
            res.redirect("/user/"+req.params.userid+"/course/new");
        }
        else{
            res.json(updated);
        }
    });
});

//DELETE courseless assignment route
router.delete("/:subassignmentId", middleware.checkCorrectUser, function(req, res){
    Subassignment.findByIdAndRemove(req.params.subassignmentId, function(err, deletedSub){
        if(err){
            //if error stay at current page
            req.flash("error", "Error Deleting");
            //TODO: better redirection
            res.redirect("/user/"+ req.params.userid + "/course/" + req.params.courseid  + "/edit");
        }
        else{
            Assignment.findByIdAndUpdate(req.params.assignmentid).populate('subassignments').exec({pull: {subassignments: {"_id": deletedSub._id}}}, function(err, updated){
                if(err){
                    console.log(err);
                }
                else{
                    console.log(updated);
                    res.json(deletedSub);
                }
            });
            }
            
            }
);
});

module.exports = router;