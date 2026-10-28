-- Motorcycle OSRM Custom Profile for Middle/Last-Mile Delivery
api_version = 4

Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require('lib/way_handlers')
find_access_tag = require('lib/access').find_access_tag

function setup()
  return {
    properties = {
      max_speed_for_map_matching     = 100/3.6, -- 100 km/h
      weight_name                    = 'duration',
      process_call_tagless_node      = false,
      u_turn_penalty                 = 20,
      continue_straight_at_waypoint  = true,
      use_turn_restrictions         = true,
      left_hand_driving              = true
    },
    default_mode              = mode.driving,
    default_speed             = 35,
    oneway_handling           = true,
    side_road_multiplier      = 0.8,
    turn_penalty              = 4.0,
    speed_reduction           = 0.8,

    -- Akses gang sempit / residential diperbolehkan untuk motor
    access_tag_whitelist = Set {
      'yes',
      'motorcycle',
      'motor_vehicle',
      'vehicle',
      'permissive',
      'designated'
    },

    access_tag_blacklist = Set {
      'no',
      'agricultural',
      'forestry',
      'emergency',
      'psv',
      'delivery'
    },

    service_access_tag_blacklist = Set {
      'private'
    },

    -- Jalan tol dilarang untuk motor di Indonesia
    restricted_highway_whitelist = Set {
      'motorway',
      'motorway_link',
      'trunk',
      'trunk_link'
    }
  }
end

function process_way(profile, way, result)
  local data = {
    highway = way:get_value_by_key('highway')
  }

  -- Larang akses jalan tol
  if data.highway == 'motorway' or data.highway == 'motorway_link' then
    return
  end

  result.forward_mode = mode.driving
  result.backward_mode = mode.driving
  result.forward_speed = profile.default_speed
  result.backward_speed = profile.default_speed
end

function process_turn(profile, turn)
  turn.duration = 0.0
  if turn.direction_modifier == direction_modifier.u_turn then
    turn.duration = turn.duration + profile.properties.u_turn_penalty
  end
  if turn.has_traffic_light then
    turn.duration = turn.duration + 5.0
  end
end

return {
  setup = setup,
  process_way = process_way,
  process_turn = process_turn
}
