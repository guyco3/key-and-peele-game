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
    <div style={{ position: "relative", flex: 1 }}>
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Type to search sketch names..."
        style={{ width: 500, padding: "8px", fontSize: 14 }}
      />
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: 500,
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            maxHeight: 300,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {filteredSketches.length > 0 ? (
            filteredSketches.map((sketch) => (
              <div
                key={sketch.id}
                onClick={() => handleSelect(sketch.name)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fff")
                }
              >
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
                  {sketch.name}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                  {sketch.description}
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>
                  {sketch.tags.join(", ")}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "10px 12px", color: "#999", fontSize: 13 }}>
              No sketches found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
