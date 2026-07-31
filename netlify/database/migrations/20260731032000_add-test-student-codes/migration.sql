INSERT INTO student_access_codes (
  code_hash,
  code_hint,
  student_name,
  grade_band,
  room_code,
  is_active,
  created_by
)
VALUES
  (
    '2249cef484f47fafd9becec91829afdeed284fd0bff68c6f1b3f327d95c5b8c0',
    '***12',
    '테스트학생1',
    '1-2',
    '2407',
    1,
    'test-seed'
  ),
  (
    'f2afcf018934dd44884ea729269648841cb9a52880db51021944e0c4ba883f0f',
    '***34',
    '테스트학생2',
    '3-4',
    '2407',
    1,
    'test-seed'
  ),
  (
    '596f46efc004a68f8724213436c27635e3d2f85e00486c86214096369c229c7e',
    '***56',
    '테스트학생3',
    '5-6',
    '2407',
    1,
    'test-seed'
  )
ON CONFLICT (code_hash) DO UPDATE SET
  code_hint = EXCLUDED.code_hint,
  student_name = EXCLUDED.student_name,
  grade_band = EXCLUDED.grade_band,
  room_code = EXCLUDED.room_code,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;
