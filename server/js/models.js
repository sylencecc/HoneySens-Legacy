define(['app/app', 'backbone.paginator'], function(HoneySens) {
	HoneySens.module('Models', function(Models, HoneySens, Backbone, Marionette, $, _) {
		Models.Event = Backbone.Model.extend({
			urlRoot: 'api/events',
            defaults: {
                new: false // Marker used to highlight new events that appeared after an incremental update
            },
            getDetailsAndPackets: function() {
                var details = new Models.EventDetails(),
                    packets = new Models.EventPackets();
                $.ajax({
                    method: 'GET',
                    url: 'api/eventdetails/by-event/' + this.id,
                    success: function(data) {
                        data = JSON.parse(data);
                        details.reset(data.details);
                        packets.reset(data.packets);
                    }
                });
                return {
                    details: details,
                    packets: packets
                };
            }
		});

		Models.Event.classification = {
			UNKNOWN: 0,
			ICMP: 1,
			CONN_ATTEMPT: 2,
			LOW_HP: 3,
			PORTSCAN: 4
		};

		Models.Event.status = {
			UNEDITED: 0,
			BUSY: 1,
			RESOLVED: 2,
			IGNORED: 3
		};

		Models.Events = Backbone.PageableCollection.extend({
			model: Models.Event,
            mode: 'server',
			url: function() {
				if(this.length > 0) {
					return 'api/events/?last_id=' + (this.last().get('id'));
				} else {
					return 'api/events/';
				}
			},
            state: {
                firstPage: 0,
                pageSize: 15,
                sortKey: 'timestamp',
                order: -1
            },
            parseState: function(resp, queryParams, state, options) {
                return {totalRecords: parseInt(resp.total_count)};
            },
            parseRecords: function(resp, options) {
                return resp.items;
            }
		});

		Models.EventDetail = Backbone.Model.extend({
			initialize: function() {
				var timestamp = this.get('timestamp') == null ? null : new Date(this.get('timestamp') * 1000);
				this.set('timestamp', timestamp);
			}
		});

		Models.EventDetail.type = {
			GENERIC: 0,
			INTERACTION: 1
		};

		Models.EventDetails = Backbone.Collection.extend({
			model: Models.EventDetail,
			url: function() {
				return 'api/eventdetails/by-event/' + this.event.id;
			}
		});

        Models.EventPacket = Backbone.Model.extend({
            defaults: {
                timestamp: '',
                protocol: 0,
                port: 0,
                headers: '',
                payload: ''
            },
            initialize: function() {
                this.set('timestamp', new Date(this.get('timestamp') * 1000));
            }
        });

        Models.EventPacket.protocol = {
            UNKNOWN: 0,
            TCP: 1,
            UDP: 2
        };

        Models.EventPackets = Backbone.Collection.extend({
            model: Models.EventPacket
        });

		Models.EventFilterCondition = Backbone.Model.extend({
			defaults: {
                'field': 1,
                'type': 0,
                'value': null
			}
		});

        Models.EventFilterCondition.field = {
            CLASSIFICATION: 0,
            SOURCE: 1,
            TARGET: 2,
            PROTOCOL: 3
        };

        Models.EventFilterCondition.type = {
            SOURCE_STATIC: 0,
            SOURCE_REGEX: 1,
            SOURCE_IPRANGE: 2,
            TARGET_PORT: 3
        };

        Models.EventFilterConditions = Backbone.Collection.extend({
            model: Models.EventFilterCondition
        });

        Models.EventFilter = Backbone.Model.extend({
            defaults: {
                'division': null,
                'name': null,
                'type': 0,
				'count': 0,
                'conditions': []
            },
            getConditionCollection: function() {
                var conditions = new Models.EventFilterConditions();
                _.each(this.get('conditions'), function(c) {
                    conditions.add(new Models.EventFilterCondition(c));
                });
                return conditions;
            }
        });

        Models.EventFilter.type = {
            WHITELIST: 0
        };

        Models.EventFilters = Backbone.PageableCollection.extend({
            model: Models.EventFilter,
            url: 'api/eventfilters',
            mode: 'client'
        });

		Models.Sensor = Backbone.Model.extend({
			status: null,
			defaults: {
                'hostname': '',
				'name' : '',
				'location': '',
                'division': null,
                'cert': null,
				'cert_fp': '',
                'config': null,
                'update_interval': '',
                'last_status': '',
                'last_status_ts': '',
                'sw_version': '',
				'last_ip' : '',
                'server_endpoint_mode': 0,
                'server_endpoint_host': null,
                'server_endpoint_port_https': null,
                'network_ip_mode': 0,
                'network_ip_address': null,
                'network_ip_netmask': null,
                'network_mac_mode': 0,
                'network_mac_address': null,
                'proxy_mode': 0,
                'proxy_host': null,
                'proxy_port': null,
                'proxy_user': null,
                'proxy_password': null,
                'config_archive_status': 0,
                'services': []
			},
			initialize: function() {
				this.status = new Models.SensorStati();
				this.status.sensor = this;
			},
			getConfig: function() {
                return this.get('config') == 1 ? HoneySens.data.models.defaultconfig : HoneySens.data.models.configs.get(this.get('config'));
			}
		});

		Models.Sensors = Backbone.PageableCollection.extend({
			model: Models.Sensor,
			url: 'api/sensors',
            mode: 'client'
		});

		Models.SSLCert = Backbone.Model.extend({
			defaults: {
				'content': '',
				'fingerprint': ''
			}
		});

		Models.SSLCerts = Backbone.Collection.extend({
			model: Models.SSLCert,
			url: 'api/certs/'
		});

		Models.SensorConfig = Backbone.Model.extend({
			defaults: {
				'interval': 5,
				'image': null,
				'recon': false,
				'kippoHoneypot': false,
				'dionaeaHoneypot': false
			}
		});

		Models.SensorConfigs = Backbone.PageableCollection.extend({
			model: Models.SensorConfig,
			url: 'api/sensorconfigs',
			mode: 'client'
		});

		Models.SensorImage = Backbone.Model.extend({
			defaults: {
				'name': '',
				'version': '',
				'description': '',
				'changelog': '',
				'file': ''
			}
		});

		Models.SensorImages = Backbone.Collection.extend({
			model: Models.SensorImage,
			url: 'api/sensorimages'
		});

		Models.SensorStatus = Backbone.Model.extend({
			initialize: function() {
				this.set('timestamp', new Date(this.get('timestamp') * 1000));
			}
		});

		Models.SensorStatus.status = {
			ERROR: 0,
			RUNNING: 1,
			UPDATE_PHASE1: 2,
			INSTALL_PHASE1: 3,
			UPDATEINSTALL_PHASE2: 4
		};

		Models.SensorStati = Backbone.Collection.extend({
			model: Models.SensorStatus,
			url: function() {
				return 'api/sensorstatus/by-sensor/' + this.sensor.id;
			}
		});

		Models.ServiceRevision = Backbone.Model.extend({
			defaults: {
				'revision': '',
				'description': '',
				'service': null
			}
		});

		Models.ServiceRevisions = Backbone.Collection.extend({
			model: Models.ServiceRevision
		});

		Models.Service = Backbone.Model.extend({
			defaults: {
				'name': '',
				'description': '',
				'repository': '',
                'revisions': [],
                'default_revision': null
			},
			getRevisions: function() {
				return new Models.ServiceRevisions(this.get('revisions'));
			}
		});

        Models.Services = Backbone.PageableCollection.extend({
            model: Models.Service,
            url: 'api/services',
            mode: 'client'
        });

        Models.Division = Backbone.Model.extend({
            defaults: {
                'name': '',
                'users': []
            },
            getUserCollection: function() {
                // TODO move to Users collection, so this no longer depends on global state
                // returns a new collection of user objects that belong to this division
                var users = new Models.Users();
                _.each(this.get('users'), function(u) {
                    users.add(HoneySens.data.models.users.get(u));
                });
                return users;
            }
        });

        Models.Divisions = Backbone.Collection.extend({
            model: Models.Division,
            url: 'api/divisions',
            byUser: function(id) {
                return new Models.Divisions(this.filter(function(division) {
                    return _.contains(division.get('users'), id);
                }));
            }
        });

        Models.User = Backbone.Model.extend({
            defaults: {
                'name': '',
                'email': '',
                'password': '',
                'role': 1,
                'divisions': [],
                'permissions': []
            }
        });

        Models.User.role = {
            GUEST: 0,
            OBSERVER: 1,
            MANAGER: 2,
            ADMIN: 3
        };

        Models.Users = Backbone.Collection.extend({
            model: Models.User,
            url: 'api/users/'
        });

        Models.IncidentContact = Backbone.Model.extend({
            defaults: {
                'division': null,
                'email': null,
                'user': null,
                'sendWeeklySummary': false,
                'sendCriticalEvents': false,
                'sendAllEvents': false
            },
            getType: function() {
                // defaults to mail if no data was set yet
                if(this.get('user') == null) return Models.IncidentContact.type.MAIL;
                else return Models.IncidentContact.type.USER;
            }
        });

        Models.IncidentContact.type = {
            MAIL: 0,
            USER: 1
        };

        Models.IncidentContacts = Backbone.Collection.extend({
            model: Models.IncidentContact,
            url: 'api/contacts/'
        });

        Models.Stats = Backbone.Model.extend({
            defaults: {
                year: '',
                month: null,
                division: null,
                events_timeline: []
            },
            url: 'api/stats'
        });

        // Initialize runtime models
        HoneySens.addInitializer(function() {
            HoneySens.data.models.defaultconfig = new Models.SensorConfig();
            HoneySens.data.models.defaultconfig.url = 'api/sensorconfigs/1';
            HoneySens.data.models.images = new Models.SensorImages();
            HoneySens.data.models.configs = new Models.SensorConfigs();
            HoneySens.data.models.sensors = new Models.Sensors();
            HoneySens.data.models.events = new Models.Events([], {state: {totalRecords: 0}});
            HoneySens.data.models.eventfilters = new Models.EventFilters();
            HoneySens.data.models.users = new Models.Users();
            HoneySens.data.models.divisions = new Models.Divisions();
            HoneySens.data.models.certs = new Models.SSLCerts();
            HoneySens.data.models.contacts = new Models.IncidentContacts();
            HoneySens.data.models.services = new Models.Services();
            HoneySens.data.models.stats = new Models.Stats();
            HoneySens.data.session.user = new Models.User();
		});
	});

	return HoneySens.Models;
});
