import React, { useState } from "react";
import sketches from "../../../shared/sketches.json";

interface Sketch {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

interface SketchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (sketchName: string) => void;
}

export default function SketchAutocomplete({
  value,
  onChange,
  onSelect,
}: SketchAutocompleteProps) {
  const [filteredSketches, setFilteredSketches] = useState<Sketch[]>(sketches);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setShowDropdown(true);
    setShowDropdown(true);
    
    if (newValue.trim().length > 0) {
      const filtered = sketches.filter((s) =>
        s.name.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredSketches(filtered);
    } else {
      // Show all sketches when input is empty
      setFilteredSketches(sketches);
    }
  };

  const handleSelect = (sketchName: string) => {
    onSelect(sketchName);
    setShowDropdown(false);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        className="input"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Type to search sketch names..."
      />
      {showDropdown && (
        <div className="dropdown">
          {filteredSketches.length > 0 ? (
            filteredSketches.map((sketch) => (
              <div
                key={sketch.id}
                onClick={() => handleSelect(sketch.name)}
                className="dropdown__item"
              >
                <div className="dropdown__title">{sketch.name}</div>
                <div className="dropdown__description">{sketch.description}</div>
                <div className="dropdown__tags">{sketch.tags.join(", ")}</div>
              </div>
            ))
          ) : (
            <div className="dropdown__item">No sketches found</div>
          )}
        </div>
      )}
    </div>
  );
}
