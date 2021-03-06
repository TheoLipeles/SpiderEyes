app.directive('forceLayout', function(PageService) {
    // Runs during compile
    return {
        // name: '',
        // priority: 1,
        // terminal: true,
        scope: {
            showsearch: '@',
            showupdate: '@',
            jsonfile: '@'
        }, // {} = isolate, true = child, false/undefined = no change
        controller: function($scope) {
            $scope.removeGraph = function() {

            }

            $scope.update = function() {

                var link = $scope.svg.selectAll(".link")
                    .data($scope.links);
                // .data($scope.links, function(d) {
                //     return d.source.id + "-" + d.target.id;
                // });

                link.enter().append("line")
                    .attr("class", "link")
                    .attr("stroke-opacity", 0.1)
                    .style("stroke-width", 5);

                // link.exit().remove();

                var drag = $scope.force.drag()
                    .origin(function(d) {
                        return d;
                    })
                    .on("dragstart", function(d) {
                        d3.event.sourceEvent.stopPropagation();
                    })
                    .on("drag", function(d) {
                        d3.select(this)
                            .attr("x", d.x = d3.event.x)
                            .attr("y", d.y = d3.event.y);
                    });

                var node = $scope.svg.selectAll(".node")
                    .data($scope.nodes, function(d) {
                        return d.id;
                    });

                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .call(drag);

                //---Hover on node, fade unconnected $scope.nodes---
                var linkedByIndex = {};
                $scope.links.forEach(function(d) {
                    // console.log("link", d)
                    var sourceIndex = d.source.index || d.source;
                    var targetIndex = d.target.index || d.target;
                    linkedByIndex[sourceIndex + "," + targetIndex] = 1;
                });

                function isConnected(a, b) {
                    return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
                }

                function fade(opacity) {
                    return function(d) {
                        nodeEnter.style("stroke-opacity", function(o) {
                            var thisOpacity = isConnected(d, o) ? 1 : opacity;
                            this.setAttribute('fill-opacity', thisOpacity);
                            return thisOpacity;
                        });

                        link.style("stroke-opacity", function(o) {
                            return o.source === d || o.target === d ? 1 : opacity;
                        });
                    };
                }

                function textFade(opacity) {
                    return function(d) {
                        nodeEnter.style("stroke-opacity", function(o) {
                            var thisOpacity = isConnected(d, o) ? 1 : opacity;
                            this.setAttribute('fill-opacity', thisOpacity);
                            if (opacity < 1 && isConnected(d, o)) {
                                d3.select(this).select("text")
                                    .attr("font-size", function(d) {
                                        if (d.size > 80) return d.size + "px";
                                        else return "14px";
                                    })
                                    .attr("font-weight", function(d) {
                                        if (d.size > 80) return "bold";
                                        else return "100";
                                    })
                                    .text(function(d) {
                                        return d.id;
                                    });
                            } else {
                                d3.select(this).select("text")
                                    .attr("font-size", function(d) {
                                        if (d.size > 80) return d.size + "px";
                                        else return "9px";
                                    })
                                    .attr("font-weight", function(d) {
                                        if (d.size > 80) return "bold";
                                        else return "100";
                                    })
                                    .text(function(d) {
                                        if (d.id) {
                                            if (d.id.length > 10)
                                                return d.id.substring(0, 10) + "...";
                                            else return d.id
                                        } else {
                                            return "";
                                        }
                                    })

                            }
                            return thisOpacity;
                        });

                        link.style("stroke-opacity", function(o) {
                            return o.source === d || o.target === d ? 1 : opacity;
                        });
                    };
                }

                //---node circles---
                nodeEnter.append("circle")
                    .attr("r", function(d) {
                        return d.size + 10;
                    })
                    .attr("class", "nodeStrokeClass")
                    .style("stroke", function(d) {
                        if (d.size >= 80) {
                            return "#b94431";
                        } else if (d.size >= 20) {
                            return "#da991c"; //#1A94DF
                        } else if (d.size >= 3) {
                            return "#1A94DF";
                        } else {
                            return "#ffffff"; //#cccccc"; //"#5b5b5b";
                        }
                    })
                    .style("stroke-width", function(d) {
                        if (d.size >= 80) {
                            return "20";
                        } else if (d.size >= 20) {
                            return "10";
                        } else if (d.size >= 3) {
                            return "7";
                        } else {
                            return "5";
                        }
                    })
                    .on("mouseover", fade(0.2))
                    .on("mouseout", fade(1));
                // .on("click", function() {
                // })

                //---node text---
                nodeEnter.append("text")
                    .attr("class", "text")
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .attr("stroke-width", "0")
                    .attr("font-size", function(d) {
                        if (d.size > 80) return d.size + "px";
                        else return "9px";
                    })
                    .attr("font-weight", function(d) {
                        if (d.size > 80) return "bold";
                        else return "100";
                    })
                    .text(function(d) {
                        if (d.id) {
                            if (d.id.length > 10)
                                return d.id.substring(0, 10) + "...";
                            else return d.id
                        } else {
                            return "";
                        }
                    })
                    .on("mouseover", textFade(0.2))
                    .on("mouseout", textFade(1));
                // .on("click", function() {
                //     d3.select(this).text(function(d) {
                //         return d.id
                //     })
                // });

                //---node tooltip
                nodeEnter.append("title")
                    .text(function(d) {
                        return "Pagerank: " + d.size + "\n\n" + d.URI;
                    });

                node.exit().remove();

                $scope.force.on("tick", function() {
                    link.attr("x1", function(d) {
                            // console.log("link x", d.source.x)
                            return d.source.x;
                        })
                        .attr("y1", function(d) {
                            // console.log("link y", d.source.y)

                            return d.source.y;
                        })
                        .attr("x2", function(d) {
                            return d.target.x;
                        })
                        .attr("y2", function(d) {
                            return d.target.y;
                        });

                    node.attr("cx", function(d) {
                            // console.log("node x", d.x)
                            return d.x;
                        })
                        .attr("cy", function(d) {
                            // console.log("node y", d.y)
                            return d.y;
                        })
                        .attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });

                    node.each(collide(0.5));
                });


                //---Search---
                var optArray = [];
                for (var i = 0; i < $scope.nodes.length - 1; i++) {
                    optArray.push($scope.nodes[i].id);
                }

                optArray = optArray.sort();

                $(function() {
                    $("#search").autocomplete({
                        source: optArray
                    });
                });

                //---collision avoidance---
                var padding = 1, // separation between circles
                    maxRadius = 250;

                function collide(alpha) {
                    var quadtree = d3.geom.quadtree($scope.nodes);
                    return function(d) {
                        var rb = d.size + 10 + maxRadius + padding,
                            nx1 = d.x - rb,
                            nx2 = d.x + rb,
                            ny1 = d.y - rb,
                            ny2 = d.y + rb;

                        quadtree.visit(function(quad, x1, y1, x2, y2) {
                            if (quad.point && (quad.point !== d)) {
                                var x = d.x - quad.point.x,
                                    y = d.y - quad.point.y,
                                    l = Math.sqrt(x * x + y * y),
                                    r = d.size + 10 + quad.point.size + 10 + padding;
                                if (l < r) {
                                    l = (l - r) / l * alpha;
                                    d.x -= x *= l;
                                    d.y -= y *= l;
                                    quad.point.x += x;
                                    quad.point.y += y;
                                }
                            }
                            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                        });
                    };
                }

                $scope.force.start();
            };

            socket.on("newNode", function(data) {
                // page={}
                // console.log(data);
                addNode({
                    id: data.title || data.url.slice(30),
                    size: data.pageRank,
                    _id: data._id,
                    URI: data.url,
                    weight: 1000
                });
            });
            socket.on("link", function(data) {
                // {source: page._id, target: childPage._id}
                // console.log(data.source);
                addLink(data.source, data.target);
            });
            socket.on("grow", function(data) {
                // page._id
                // console.log("Growing");
                updateNode(data);
            });


            // Add and remove elements on the graph object
            var addNode = function(nodeObj) {
                $scope.nodes.push(nodeObj);
                // $scope.update();
                // if ($scope.nodes.length === 1) $scope.update();
                $scope.update();
                document.getElementById("latest").innerHTML = "Latest page: " + nodeObj.id;
            };

            var updateNode = function(nodeId) {
                $scope.nodes.forEach(function(node) {
                    if ($scope.node._id === nodeId) {
                        $scope.node.size++;
                    }
                });
                $scope.update();
            };

            // var removeNode = function(id) {
            //     var i = 0;
            //     var n = findNode(id);
            //     while (i < $scope.links.length) {
            //         if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
            //             $scope.links.splice(i, 1);
            //         } else i++;
            //     }
            //     $scope.nodes.splice(findNodeIndex(id), 1);
            //     update();
            // };

            // var removeLink = function(source, target) {
            //     for (var i = 0; i < $scope.links.length; i++) {
            //         if (links[i].source.id == source && $scope.links[i].target.id == target) {
            //             $scope.links.splice(i, 1);
            //             break;
            //         }
            //     }
            //     update();
            // };

            // var removeallLinks = function() {
            //     $scope.links.splice(0, $scope.links.length);
            //     update();
            // };

            // var removeAllNodes = function() {
            //     $scope.nodes.splice(0, $scope.links.length);
            //     update();
            // };

            var addLink = function(source_id, target_id) {
                $scope.links.push({
                    "source": findNodeAndUpdate(source_id),
                    "target": findNodeAndUpdate(target_id)
                });
                $scope.update();
                keepNodesOnTop();
            };

            var findNodeAndUpdate = function(_id) {
                for (var i in $scope.nodes) {
                    if ($scope.nodes[i]._id == _id) {
                        $scope.nodes[i].weight += 1;
                        return $scope.nodes[i];
                    }
                }
            };

            var findNode = function(_id) {
                for (var i in $scope.nodes) {
                    if ($scope.nodes[i]._id == _id) return $scope.nodes[i];
                }
            };

            function keepNodesOnTop() {
                $(".nodeStrokeClass").each(function(index) {
                    var gnode = this.parentNode;
                    gnode.parentNode.appendChild(gnode);
                });
            }

            // var findNodeIndex = function(_id) {
            //     for (var i = 0; i < $scope.nodes.length; i++) {
            //         if (nodes[i]._id == _id) {
            //             return i;
            //         }
            //     }
            // };



            $scope.searchNode = function() {
                var selectedVal = document.getElementById('search').value;
                // var selectedEndVal = document.getElementById('searchEnd').value;
                // console.log("end", selectedEndVal === "")
                var node = $scope.svg.selectAll(".node");
                var selectedNode = node.filter(function(d) {
                    return d.id === selectedVal;
                });
                // console.log(selectedNode[0])

                // var path = []
                // path.push(selectedNode[0])

                var link = $scope.svg.selectAll(".link");
                // var $scope.links = link.filter(function(l) {
                //     return l.source === selectedNode.index
                // })
                // console.log(links)


                var unselected = node.filter(function(d) {
                    return d.id !== selectedVal; // && d.id !== selectedEndVal;
                });
                unselected.style("opacity", "0");

                link.style("opacity", "0");

                d3.selectAll(".node, .link").transition()
                    .duration(5000)
                    .style("opacity", 1);

                $scope.svg.attr("transform", "translate(" + (-parseInt(selectedNode.attr("cx")) + $scope.width / 2) + "," + (-parseInt(selectedNode.attr("cy")) + $scope.height / 2) + ")" + " scale(" + 1 + ")");
            };
        },
        // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
        restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
        // template: '',
        templateUrl: 'js/common/directives/force-layout/force-layout.html',
        // replace: true,
        // transclude: true,
        // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
        link: function($scope) {

            $scope.jsonfile = $scope.jsonfile || "graph25sm.json";
            $scope.showsearch = $scope.showsearch === "true";
            $scope.showupdate = $scope.showupdate === "true";

            $scope.width = $(".graph-container").width();
            $scope.height = window.innerHeight - 150;
            if ($scope.showsearch) $scope.height -= 25;
            if ($scope.showupdate) $scope.height -= 25;

            $scope.force = d3.layout.force()
                .gravity(0.05)
                .charge(-500)
                .linkDistance(100)
                .size([$scope.width, $scope.height]);

            var zoom = d3.behavior.zoom()
                .translate([600, 250])
                .scale(0.2);

            $scope.svg = d3.select(".graph")
                .append("svg")
                .attr("width", $scope.width)
                .attr("height", $scope.height)
                .attr("pointer-events", "all")
                .call(zoom.on("zoom", function() {
                    // console.log(d3.event.scale)
                    $scope.svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
                }))
                .append('g')
                .attr("transform", "translate(600,250) scale(0.2)");

            d3.json($scope.jsonfile, function(error, json) {
                if (error) throw error;

                $scope.force.links(json.links);
                $scope.force.nodes(json.nodes);

                $scope.nodes = $scope.force.nodes();
                // console.log("nodes", $scope.nodes)
                $scope.links = $scope.force.links();


                $scope.update();
            });
        }
    };
});