jq '
  map(
    select(
      (
        (.tags | map(ascii_downcase) | any(contains("compilation"))) or
        (.description | ascii_downcase | contains("compilation"))
      ) | not
    )
  )
' sketches.json > sketches.clean.json
