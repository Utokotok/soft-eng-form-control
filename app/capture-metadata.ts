export type CaptureFacts = { capturedAt: Date; latitude: number; longitude: number; camera: string; width: number; height: number };
export async function encodeCapture(jpeg: string, facts: CaptureFacts) {
  const piexif = (await import("piexifjs")).default;
  const exifDate = facts.capturedAt.toISOString().slice(0, 19).replace(/-/g, ":").replace("T", " ");
  const exif = piexif.dump({
    "0th": { [piexif.ImageIFD.Software]: "Red Eagle web capture", [piexif.ImageIFD.Model]: facts.camera.replace(/[^\x20-\x7E]/g, ""), [piexif.ImageIFD.DateTime]: exifDate, [piexif.ImageIFD.ImageDescription]: "Live attendance capture. Application-written metadata; timestamp in UTC." },
    Exif: { [piexif.ExifIFD.DateTimeOriginal]: exifDate, [piexif.ExifIFD.PixelXDimension]: facts.width, [piexif.ExifIFD.PixelYDimension]: facts.height },
    GPS: { [piexif.GPSIFD.GPSLatitudeRef]: facts.latitude < 0 ? "S" : "N", [piexif.GPSIFD.GPSLatitude]: piexif.GPSHelper.degToDmsRational(Math.abs(facts.latitude)), [piexif.GPSIFD.GPSLongitudeRef]: facts.longitude < 0 ? "W" : "E", [piexif.GPSIFD.GPSLongitude]: piexif.GPSHelper.degToDmsRational(Math.abs(facts.longitude)) },
  });
  const encoded = piexif.insert(exif, jpeg);
  const bytes = Uint8Array.from(atob(encoded.split(",")[1]), char => char.charCodeAt(0));
  const library = await import("exifr");
  const parser = library.parse || library.default.parse;
  const parsed = await parser(bytes, { gps: true });
  if (!parsed || typeof parsed.latitude !== "number" || typeof parsed.longitude !== "number") throw new Error("Photo metadata could not be verified. Please capture again.");
  return { blob: new Blob([bytes], { type: "image/jpeg" }), parsed };
}
