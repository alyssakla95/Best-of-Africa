-- The former HTML adapter accumulated the zero-yield cooldown. Reset only the
-- consecutive counter so the new first-party API adapter is eligible on the
-- next scheduler tick while preserving its historical telemetry.
UPDATE source_acquisition_yield
SET consecutive_zero_qualified = 0
WHERE source_id = 'primary-ifc-africa';
