import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'trips',
      columns: [
        { name: 'destination', type: 'string' },
        { name: 'start_date', type: 'string' },
        { name: 'end_date', type: 'string' },
        { name: 'estimated_cost', type: 'number' },
        { name: 'activities', type: 'string' }, // JSON stringified array
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'flights',
      columns: [
        { name: 'trip_id', type: 'string', isIndexed: true },
        { name: 'airline', type: 'string' },
        { name: 'flight_number', type: 'string' },
        { name: 'departure_airport', type: 'string' },
        { name: 'arrival_airport', type: 'string' },
        { name: 'departure_time', type: 'string' },
        { name: 'arrival_time', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'booking_reference', type: 'string', isOptional: true },
        { name: 'booking_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'user_preferences',
      columns: [
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' }, // JSON stringified value
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
  ],
})
