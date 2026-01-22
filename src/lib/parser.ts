import Papa from 'papaparse';
import { TrackPoint } from '../types/data';

const REQUIRED_COLUMNS = ['timestamp', 'player_id', 'x', 'y', 'speed'];

export const parseCSV = (file: File): Promise<TrackPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true, // Use worker to avoid freezing UI
      complete: (results) => {
        const { data, meta, errors } = results;

        if (errors.length > 0) {
          // You might want to handle specific parsing errors here
          console.warn('CSV Parsing warnings/errors:', errors);
        }

        if (!meta.fields) {
          reject(new Error('CSV file is empty or could not be parsed.'));
          return;
        }

        // Validate columns
        const missingColumns = REQUIRED_COLUMNS.filter(
          (col) => !meta.fields?.includes(col)
        );

        if (missingColumns.length > 0) {
          reject(
            new Error(
              `Missing required columns: ${missingColumns.join(', ')}`
            )
          );
          return;
        }

        // Normalize Data
        const normalizedData: TrackPoint[] = (data as Record<string, string>[])
          .map((row) => {
            // Basic validation for required fields in row
            if (
              row.timestamp === undefined ||
              row.x === undefined ||
              row.y === undefined
            ) {
              return null;
            }

            return {
              timestamp: parseFloat(row.timestamp),
              player_id: row.player_id,
              x: parseFloat(row.x),
              y: parseFloat(row.y),
              speed: parseFloat(row.speed || '0'),
            };
          })
          .filter((item): item is TrackPoint => item !== null); // Remove nulls

        resolve(normalizedData);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
