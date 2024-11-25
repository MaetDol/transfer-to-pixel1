var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/piexifjs/piexif.js
var require_piexif = __commonJS({
  "node_modules/piexifjs/piexif.js"(exports, module2) {
    (function() {
      "use strict";
      var that = {};
      that.version = "1.0.4";
      that.remove = function(jpeg) {
        var b64 = false;
        if (jpeg.slice(0, 2) == "\xFF\xD8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
          jpeg = atob(jpeg.split(",")[1]);
          b64 = true;
        } else {
          throw new Error("Given data is not jpeg.");
        }
        var segments = splitIntoSegments(jpeg);
        var newSegments = segments.filter(function(seg) {
          return !(seg.slice(0, 2) == "\xFF\xE1" && seg.slice(4, 10) == "Exif\0\0");
        });
        var new_data = newSegments.join("");
        if (b64) {
          new_data = "data:image/jpeg;base64," + btoa(new_data);
        }
        return new_data;
      };
      that.insert = function(exif, jpeg) {
        var b64 = false;
        if (exif.slice(0, 6) != "Exif\0\0") {
          throw new Error("Given data is not exif.");
        }
        if (jpeg.slice(0, 2) == "\xFF\xD8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
          jpeg = atob(jpeg.split(",")[1]);
          b64 = true;
        } else {
          throw new Error("Given data is not jpeg.");
        }
        var exifStr = "\xFF\xE1" + pack(">H", [exif.length + 2]) + exif;
        var segments = splitIntoSegments(jpeg);
        var new_data = mergeSegments(segments, exifStr);
        if (b64) {
          new_data = "data:image/jpeg;base64," + btoa(new_data);
        }
        return new_data;
      };
      that.load = function(data) {
        var input_data;
        if (typeof data == "string") {
          if (data.slice(0, 2) == "\xFF\xD8") {
            input_data = data;
          } else if (data.slice(0, 23) == "data:image/jpeg;base64," || data.slice(0, 22) == "data:image/jpg;base64,") {
            input_data = atob(data.split(",")[1]);
          } else if (data.slice(0, 4) == "Exif") {
            input_data = data.slice(6);
          } else {
            throw new Error("'load' gots invalid file data.");
          }
        } else {
          throw new Error("'load' gots invalid type argument.");
        }
        var exifDict = {};
        var exif_dict = {
          "0th": {},
          "Exif": {},
          "GPS": {},
          "Interop": {},
          "1st": {},
          "thumbnail": null
        };
        var exifReader = new ExifReader(input_data);
        if (exifReader.tiftag === null) {
          return exif_dict;
        }
        if (exifReader.tiftag.slice(0, 2) == "II") {
          exifReader.endian_mark = "<";
        } else {
          exifReader.endian_mark = ">";
        }
        var pointer = unpack(
          exifReader.endian_mark + "L",
          exifReader.tiftag.slice(4, 8)
        )[0];
        exif_dict["0th"] = exifReader.get_ifd(pointer, "0th");
        var first_ifd_pointer = exif_dict["0th"]["first_ifd_pointer"];
        delete exif_dict["0th"]["first_ifd_pointer"];
        if (34665 in exif_dict["0th"]) {
          pointer = exif_dict["0th"][34665];
          exif_dict["Exif"] = exifReader.get_ifd(pointer, "Exif");
        }
        if (34853 in exif_dict["0th"]) {
          pointer = exif_dict["0th"][34853];
          exif_dict["GPS"] = exifReader.get_ifd(pointer, "GPS");
        }
        if (40965 in exif_dict["Exif"]) {
          pointer = exif_dict["Exif"][40965];
          exif_dict["Interop"] = exifReader.get_ifd(pointer, "Interop");
        }
        if (first_ifd_pointer != "\0\0\0\0") {
          pointer = unpack(
            exifReader.endian_mark + "L",
            first_ifd_pointer
          )[0];
          exif_dict["1st"] = exifReader.get_ifd(pointer, "1st");
          if (513 in exif_dict["1st"] && 514 in exif_dict["1st"]) {
            var end = exif_dict["1st"][513] + exif_dict["1st"][514];
            var thumb = exifReader.tiftag.slice(exif_dict["1st"][513], end);
            exif_dict["thumbnail"] = thumb;
          }
        }
        return exif_dict;
      };
      that.dump = function(exif_dict_original) {
        var TIFF_HEADER_LENGTH = 8;
        var exif_dict = copy(exif_dict_original);
        var header = "Exif\0\0MM\0*\0\0\0\b";
        var exif_is = false;
        var gps_is = false;
        var interop_is = false;
        var first_is = false;
        var zeroth_ifd, exif_ifd, interop_ifd, gps_ifd, first_ifd;
        if ("0th" in exif_dict) {
          zeroth_ifd = exif_dict["0th"];
        } else {
          zeroth_ifd = {};
        }
        if ("Exif" in exif_dict && Object.keys(exif_dict["Exif"]).length || "Interop" in exif_dict && Object.keys(exif_dict["Interop"]).length) {
          zeroth_ifd[34665] = 1;
          exif_is = true;
          exif_ifd = exif_dict["Exif"];
          if ("Interop" in exif_dict && Object.keys(exif_dict["Interop"]).length) {
            exif_ifd[40965] = 1;
            interop_is = true;
            interop_ifd = exif_dict["Interop"];
          } else if (Object.keys(exif_ifd).indexOf(that.ExifIFD.InteroperabilityTag.toString()) > -1) {
            delete exif_ifd[40965];
          }
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.ExifTag.toString()) > -1) {
          delete zeroth_ifd[34665];
        }
        if ("GPS" in exif_dict && Object.keys(exif_dict["GPS"]).length) {
          zeroth_ifd[that.ImageIFD.GPSTag] = 1;
          gps_is = true;
          gps_ifd = exif_dict["GPS"];
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.GPSTag.toString()) > -1) {
          delete zeroth_ifd[that.ImageIFD.GPSTag];
        }
        if ("1st" in exif_dict && "thumbnail" in exif_dict && exif_dict["thumbnail"] != null) {
          first_is = true;
          exif_dict["1st"][513] = 1;
          exif_dict["1st"][514] = 1;
          first_ifd = exif_dict["1st"];
        }
        var zeroth_set = _dict_to_bytes(zeroth_ifd, "0th", 0);
        var zeroth_length = zeroth_set[0].length + exif_is * 12 + gps_is * 12 + 4 + zeroth_set[1].length;
        var exif_set, exif_bytes = "", exif_length = 0, gps_set, gps_bytes = "", gps_length = 0, interop_set, interop_bytes = "", interop_length = 0, first_set, first_bytes = "", thumbnail;
        if (exif_is) {
          exif_set = _dict_to_bytes(exif_ifd, "Exif", zeroth_length);
          exif_length = exif_set[0].length + interop_is * 12 + exif_set[1].length;
        }
        if (gps_is) {
          gps_set = _dict_to_bytes(gps_ifd, "GPS", zeroth_length + exif_length);
          gps_bytes = gps_set.join("");
          gps_length = gps_bytes.length;
        }
        if (interop_is) {
          var offset = zeroth_length + exif_length + gps_length;
          interop_set = _dict_to_bytes(interop_ifd, "Interop", offset);
          interop_bytes = interop_set.join("");
          interop_length = interop_bytes.length;
        }
        if (first_is) {
          var offset = zeroth_length + exif_length + gps_length + interop_length;
          first_set = _dict_to_bytes(first_ifd, "1st", offset);
          thumbnail = _get_thumbnail(exif_dict["thumbnail"]);
          if (thumbnail.length > 64e3) {
            throw new Error("Given thumbnail is too large. max 64kB");
          }
        }
        var exif_pointer = "", gps_pointer = "", interop_pointer = "", first_ifd_pointer = "\0\0\0\0";
        if (exif_is) {
          var pointer_value = TIFF_HEADER_LENGTH + zeroth_length;
          var pointer_str = pack(">L", [pointer_value]);
          var key = 34665;
          var key_str = pack(">H", [key]);
          var type_str = pack(">H", [TYPES["Long"]]);
          var length_str = pack(">L", [1]);
          exif_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (gps_is) {
          var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length;
          var pointer_str = pack(">L", [pointer_value]);
          var key = 34853;
          var key_str = pack(">H", [key]);
          var type_str = pack(">H", [TYPES["Long"]]);
          var length_str = pack(">L", [1]);
          gps_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (interop_is) {
          var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length + gps_length;
          var pointer_str = pack(">L", [pointer_value]);
          var key = 40965;
          var key_str = pack(">H", [key]);
          var type_str = pack(">H", [TYPES["Long"]]);
          var length_str = pack(">L", [1]);
          interop_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (first_is) {
          var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length + gps_length + interop_length;
          first_ifd_pointer = pack(">L", [pointer_value]);
          var thumbnail_pointer = pointer_value + first_set[0].length + 24 + 4 + first_set[1].length;
          var thumbnail_p_bytes = "\0\0\0\0" + pack(">L", [thumbnail_pointer]);
          var thumbnail_length_bytes = "\0\0\0\0" + pack(">L", [thumbnail.length]);
          first_bytes = first_set[0] + thumbnail_p_bytes + thumbnail_length_bytes + "\0\0\0\0" + first_set[1] + thumbnail;
        }
        var zeroth_bytes = zeroth_set[0] + exif_pointer + gps_pointer + first_ifd_pointer + zeroth_set[1];
        if (exif_is) {
          exif_bytes = exif_set[0] + interop_pointer + exif_set[1];
        }
        return header + zeroth_bytes + exif_bytes + gps_bytes + interop_bytes + first_bytes;
      };
      function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
      }
      function _get_thumbnail(jpeg) {
        var segments = splitIntoSegments(jpeg);
        while ("\xFF\xE0" <= segments[1].slice(0, 2) && segments[1].slice(0, 2) <= "\xFF\xEF") {
          segments = [segments[0]].concat(segments.slice(2));
        }
        return segments.join("");
      }
      function _pack_byte(array) {
        return pack(">" + nStr("B", array.length), array);
      }
      function _pack_short(array) {
        return pack(">" + nStr("H", array.length), array);
      }
      function _pack_long(array) {
        return pack(">" + nStr("L", array.length), array);
      }
      function _value_to_bytes(raw_value, value_type, offset) {
        var four_bytes_over = "";
        var value_str = "";
        var length, new_value, num, den;
        if (value_type == "Byte") {
          length = raw_value.length;
          if (length <= 4) {
            value_str = _pack_byte(raw_value) + nStr("\0", 4 - length);
          } else {
            value_str = pack(">L", [offset]);
            four_bytes_over = _pack_byte(raw_value);
          }
        } else if (value_type == "Short") {
          length = raw_value.length;
          if (length <= 2) {
            value_str = _pack_short(raw_value) + nStr("\0\0", 2 - length);
          } else {
            value_str = pack(">L", [offset]);
            four_bytes_over = _pack_short(raw_value);
          }
        } else if (value_type == "Long") {
          length = raw_value.length;
          if (length <= 1) {
            value_str = _pack_long(raw_value);
          } else {
            value_str = pack(">L", [offset]);
            four_bytes_over = _pack_long(raw_value);
          }
        } else if (value_type == "Ascii") {
          new_value = raw_value + "\0";
          length = new_value.length;
          if (length > 4) {
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
          } else {
            value_str = new_value + nStr("\0", 4 - length);
          }
        } else if (value_type == "Rational") {
          if (typeof raw_value[0] == "number") {
            length = 1;
            num = raw_value[0];
            den = raw_value[1];
            new_value = pack(">L", [num]) + pack(">L", [den]);
          } else {
            length = raw_value.length;
            new_value = "";
            for (var n = 0; n < length; n++) {
              num = raw_value[n][0];
              den = raw_value[n][1];
              new_value += pack(">L", [num]) + pack(">L", [den]);
            }
          }
          value_str = pack(">L", [offset]);
          four_bytes_over = new_value;
        } else if (value_type == "SRational") {
          if (typeof raw_value[0] == "number") {
            length = 1;
            num = raw_value[0];
            den = raw_value[1];
            new_value = pack(">l", [num]) + pack(">l", [den]);
          } else {
            length = raw_value.length;
            new_value = "";
            for (var n = 0; n < length; n++) {
              num = raw_value[n][0];
              den = raw_value[n][1];
              new_value += pack(">l", [num]) + pack(">l", [den]);
            }
          }
          value_str = pack(">L", [offset]);
          four_bytes_over = new_value;
        } else if (value_type == "Undefined") {
          length = raw_value.length;
          if (length > 4) {
            value_str = pack(">L", [offset]);
            four_bytes_over = raw_value;
          } else {
            value_str = raw_value + nStr("\0", 4 - length);
          }
        }
        var length_str = pack(">L", [length]);
        return [length_str, value_str, four_bytes_over];
      }
      function _dict_to_bytes(ifd_dict, ifd, ifd_offset) {
        var TIFF_HEADER_LENGTH = 8;
        var tag_count = Object.keys(ifd_dict).length;
        var entry_header = pack(">H", [tag_count]);
        var entries_length;
        if (["0th", "1st"].indexOf(ifd) > -1) {
          entries_length = 2 + tag_count * 12 + 4;
        } else {
          entries_length = 2 + tag_count * 12;
        }
        var entries = "";
        var values = "";
        var key;
        for (var key in ifd_dict) {
          if (typeof key == "string") {
            key = parseInt(key);
          }
          if (ifd == "0th" && [34665, 34853].indexOf(key) > -1) {
            continue;
          } else if (ifd == "Exif" && key == 40965) {
            continue;
          } else if (ifd == "1st" && [513, 514].indexOf(key) > -1) {
            continue;
          }
          var raw_value = ifd_dict[key];
          var key_str = pack(">H", [key]);
          var value_type = TAGS[ifd][key]["type"];
          var type_str = pack(">H", [TYPES[value_type]]);
          if (typeof raw_value == "number") {
            raw_value = [raw_value];
          }
          var offset = TIFF_HEADER_LENGTH + entries_length + ifd_offset + values.length;
          var b = _value_to_bytes(raw_value, value_type, offset);
          var length_str = b[0];
          var value_str = b[1];
          var four_bytes_over = b[2];
          entries += key_str + type_str + length_str + value_str;
          values += four_bytes_over;
        }
        return [entry_header + entries, values];
      }
      function ExifReader(data) {
        var segments, app1;
        if (data.slice(0, 2) == "\xFF\xD8") {
          segments = splitIntoSegments(data);
          app1 = getExifSeg(segments);
          if (app1) {
            this.tiftag = app1.slice(10);
          } else {
            this.tiftag = null;
          }
        } else if (["II", "MM"].indexOf(data.slice(0, 2)) > -1) {
          this.tiftag = data;
        } else if (data.slice(0, 4) == "Exif") {
          this.tiftag = data.slice(6);
        } else {
          throw new Error("Given file is neither JPEG nor TIFF.");
        }
      }
      ExifReader.prototype = {
        get_ifd: function(pointer, ifd_name) {
          var ifd_dict = {};
          var tag_count = unpack(
            this.endian_mark + "H",
            this.tiftag.slice(pointer, pointer + 2)
          )[0];
          var offset = pointer + 2;
          var t;
          if (["0th", "1st"].indexOf(ifd_name) > -1) {
            t = "Image";
          } else {
            t = ifd_name;
          }
          for (var x = 0; x < tag_count; x++) {
            pointer = offset + 12 * x;
            var tag = unpack(
              this.endian_mark + "H",
              this.tiftag.slice(pointer, pointer + 2)
            )[0];
            var value_type = unpack(
              this.endian_mark + "H",
              this.tiftag.slice(pointer + 2, pointer + 4)
            )[0];
            var value_num = unpack(
              this.endian_mark + "L",
              this.tiftag.slice(pointer + 4, pointer + 8)
            )[0];
            var value = this.tiftag.slice(pointer + 8, pointer + 12);
            var v_set = [value_type, value_num, value];
            if (tag in TAGS[t]) {
              ifd_dict[tag] = this.convert_value(v_set);
            }
          }
          if (ifd_name == "0th") {
            pointer = offset + 12 * tag_count;
            ifd_dict["first_ifd_pointer"] = this.tiftag.slice(pointer, pointer + 4);
          }
          return ifd_dict;
        },
        convert_value: function(val) {
          var data = null;
          var t = val[0];
          var length = val[1];
          var value = val[2];
          var pointer;
          if (t == 1) {
            if (length > 4) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              data = unpack(
                this.endian_mark + nStr("B", length),
                this.tiftag.slice(pointer, pointer + length)
              );
            } else {
              data = unpack(this.endian_mark + nStr("B", length), value.slice(0, length));
            }
          } else if (t == 2) {
            if (length > 4) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              data = this.tiftag.slice(pointer, pointer + length - 1);
            } else {
              data = value.slice(0, length - 1);
            }
          } else if (t == 3) {
            if (length > 2) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              data = unpack(
                this.endian_mark + nStr("H", length),
                this.tiftag.slice(pointer, pointer + length * 2)
              );
            } else {
              data = unpack(
                this.endian_mark + nStr("H", length),
                value.slice(0, length * 2)
              );
            }
          } else if (t == 4) {
            if (length > 1) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              data = unpack(
                this.endian_mark + nStr("L", length),
                this.tiftag.slice(pointer, pointer + length * 4)
              );
            } else {
              data = unpack(
                this.endian_mark + nStr("L", length),
                value
              );
            }
          } else if (t == 5) {
            pointer = unpack(this.endian_mark + "L", value)[0];
            if (length > 1) {
              data = [];
              for (var x = 0; x < length; x++) {
                data.push([
                  unpack(
                    this.endian_mark + "L",
                    this.tiftag.slice(pointer + x * 8, pointer + 4 + x * 8)
                  )[0],
                  unpack(
                    this.endian_mark + "L",
                    this.tiftag.slice(pointer + 4 + x * 8, pointer + 8 + x * 8)
                  )[0]
                ]);
              }
            } else {
              data = [
                unpack(
                  this.endian_mark + "L",
                  this.tiftag.slice(pointer, pointer + 4)
                )[0],
                unpack(
                  this.endian_mark + "L",
                  this.tiftag.slice(pointer + 4, pointer + 8)
                )[0]
              ];
            }
          } else if (t == 7) {
            if (length > 4) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              data = this.tiftag.slice(pointer, pointer + length);
            } else {
              data = value.slice(0, length);
            }
          } else if (t == 9) {
            if (length > 1) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              data = unpack(
                this.endian_mark + nStr("l", length),
                this.tiftag.slice(pointer, pointer + length * 4)
              );
            } else {
              data = unpack(
                this.endian_mark + nStr("l", length),
                value
              );
            }
          } else if (t == 10) {
            pointer = unpack(this.endian_mark + "L", value)[0];
            if (length > 1) {
              data = [];
              for (var x = 0; x < length; x++) {
                data.push([
                  unpack(
                    this.endian_mark + "l",
                    this.tiftag.slice(pointer + x * 8, pointer + 4 + x * 8)
                  )[0],
                  unpack(
                    this.endian_mark + "l",
                    this.tiftag.slice(pointer + 4 + x * 8, pointer + 8 + x * 8)
                  )[0]
                ]);
              }
            } else {
              data = [
                unpack(
                  this.endian_mark + "l",
                  this.tiftag.slice(pointer, pointer + 4)
                )[0],
                unpack(
                  this.endian_mark + "l",
                  this.tiftag.slice(pointer + 4, pointer + 8)
                )[0]
              ];
            }
          } else {
            throw new Error("Exif might be wrong. Got incorrect value type to decode. type:" + t);
          }
          if (data instanceof Array && data.length == 1) {
            return data[0];
          } else {
            return data;
          }
        }
      };
      if (typeof window !== "undefined" && typeof window.btoa === "function") {
        var btoa = window.btoa;
      }
      if (typeof btoa === "undefined") {
        var btoa = function(input) {
          var output = "";
          var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
          var i = 0;
          var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = (chr1 & 3) << 4 | chr2 >> 4;
            enc3 = (chr2 & 15) << 2 | chr3 >> 6;
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
              enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
              enc4 = 64;
            }
            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
          }
          return output;
        };
      }
      if (typeof window !== "undefined" && typeof window.atob === "function") {
        var atob = window.atob;
      }
      if (typeof atob === "undefined") {
        var atob = function(input) {
          var output = "";
          var chr1, chr2, chr3;
          var enc1, enc2, enc3, enc4;
          var i = 0;
          var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
          while (i < input.length) {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));
            chr1 = enc1 << 2 | enc2 >> 4;
            chr2 = (enc2 & 15) << 4 | enc3 >> 2;
            chr3 = (enc3 & 3) << 6 | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
              output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
              output = output + String.fromCharCode(chr3);
            }
          }
          return output;
        };
      }
      function getImageSize(imageArray) {
        var segments = slice2Segments(imageArray);
        var seg, width, height, SOF = [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207];
        for (var x = 0; x < segments.length; x++) {
          seg = segments[x];
          if (SOF.indexOf(seg[1]) >= 0) {
            height = seg[5] * 256 + seg[6];
            width = seg[7] * 256 + seg[8];
            break;
          }
        }
        return [width, height];
      }
      function pack(mark, array) {
        if (!(array instanceof Array)) {
          throw new Error("'pack' error. Got invalid type argument.");
        }
        if (mark.length - 1 != array.length) {
          throw new Error("'pack' error. " + (mark.length - 1) + " marks, " + array.length + " elements.");
        }
        var littleEndian;
        if (mark[0] == "<") {
          littleEndian = true;
        } else if (mark[0] == ">") {
          littleEndian = false;
        } else {
          throw new Error("");
        }
        var packed = "";
        var p = 1;
        var val = null;
        var c = null;
        var valStr = null;
        while (c = mark[p]) {
          if (c.toLowerCase() == "b") {
            val = array[p - 1];
            if (c == "b" && val < 0) {
              val += 256;
            }
            if (val > 255 || val < 0) {
              throw new Error("'pack' error.");
            } else {
              valStr = String.fromCharCode(val);
            }
          } else if (c == "H") {
            val = array[p - 1];
            if (val > 65535 || val < 0) {
              throw new Error("'pack' error.");
            } else {
              valStr = String.fromCharCode(Math.floor(val % 65536 / 256)) + String.fromCharCode(val % 256);
              if (littleEndian) {
                valStr = valStr.split("").reverse().join("");
              }
            }
          } else if (c.toLowerCase() == "l") {
            val = array[p - 1];
            if (c == "l" && val < 0) {
              val += 4294967296;
            }
            if (val > 4294967295 || val < 0) {
              throw new Error("'pack' error.");
            } else {
              valStr = String.fromCharCode(Math.floor(val / 16777216)) + String.fromCharCode(Math.floor(val % 16777216 / 65536)) + String.fromCharCode(Math.floor(val % 65536 / 256)) + String.fromCharCode(val % 256);
              if (littleEndian) {
                valStr = valStr.split("").reverse().join("");
              }
            }
          } else {
            throw new Error("'pack' error.");
          }
          packed += valStr;
          p += 1;
        }
        return packed;
      }
      function unpack(mark, str) {
        if (typeof str != "string") {
          throw new Error("'unpack' error. Got invalid type argument.");
        }
        var l = 0;
        for (var markPointer = 1; markPointer < mark.length; markPointer++) {
          if (mark[markPointer].toLowerCase() == "b") {
            l += 1;
          } else if (mark[markPointer].toLowerCase() == "h") {
            l += 2;
          } else if (mark[markPointer].toLowerCase() == "l") {
            l += 4;
          } else {
            throw new Error("'unpack' error. Got invalid mark.");
          }
        }
        if (l != str.length) {
          throw new Error("'unpack' error. Mismatch between symbol and string length. " + l + ":" + str.length);
        }
        var littleEndian;
        if (mark[0] == "<") {
          littleEndian = true;
        } else if (mark[0] == ">") {
          littleEndian = false;
        } else {
          throw new Error("'unpack' error.");
        }
        var unpacked = [];
        var strPointer = 0;
        var p = 1;
        var val = null;
        var c = null;
        var length = null;
        var sliced = "";
        while (c = mark[p]) {
          if (c.toLowerCase() == "b") {
            length = 1;
            sliced = str.slice(strPointer, strPointer + length);
            val = sliced.charCodeAt(0);
            if (c == "b" && val >= 128) {
              val -= 256;
            }
          } else if (c == "H") {
            length = 2;
            sliced = str.slice(strPointer, strPointer + length);
            if (littleEndian) {
              sliced = sliced.split("").reverse().join("");
            }
            val = sliced.charCodeAt(0) * 256 + sliced.charCodeAt(1);
          } else if (c.toLowerCase() == "l") {
            length = 4;
            sliced = str.slice(strPointer, strPointer + length);
            if (littleEndian) {
              sliced = sliced.split("").reverse().join("");
            }
            val = sliced.charCodeAt(0) * 16777216 + sliced.charCodeAt(1) * 65536 + sliced.charCodeAt(2) * 256 + sliced.charCodeAt(3);
            if (c == "l" && val >= 2147483648) {
              val -= 4294967296;
            }
          } else {
            throw new Error("'unpack' error. " + c);
          }
          unpacked.push(val);
          strPointer += length;
          p += 1;
        }
        return unpacked;
      }
      function nStr(ch, num) {
        var str = "";
        for (var i = 0; i < num; i++) {
          str += ch;
        }
        return str;
      }
      function splitIntoSegments(data) {
        if (data.slice(0, 2) != "\xFF\xD8") {
          throw new Error("Given data isn't JPEG.");
        }
        var head = 2;
        var segments = ["\xFF\xD8"];
        while (true) {
          if (data.slice(head, head + 2) == "\xFF\xDA") {
            segments.push(data.slice(head));
            break;
          } else {
            var length = unpack(">H", data.slice(head + 2, head + 4))[0];
            var endPoint = head + length + 2;
            segments.push(data.slice(head, endPoint));
            head = endPoint;
          }
          if (head >= data.length) {
            throw new Error("Wrong JPEG data.");
          }
        }
        return segments;
      }
      function getExifSeg(segments) {
        var seg;
        for (var i = 0; i < segments.length; i++) {
          seg = segments[i];
          if (seg.slice(0, 2) == "\xFF\xE1" && seg.slice(4, 10) == "Exif\0\0") {
            return seg;
          }
        }
        return null;
      }
      function mergeSegments(segments, exif) {
        var hasExifSegment = false;
        var additionalAPP1ExifSegments = [];
        segments.forEach(function(segment, i) {
          if (segment.slice(0, 2) == "\xFF\xE1" && segment.slice(4, 10) == "Exif\0\0") {
            if (!hasExifSegment) {
              segments[i] = exif;
              hasExifSegment = true;
            } else {
              additionalAPP1ExifSegments.unshift(i);
            }
          }
        });
        additionalAPP1ExifSegments.forEach(function(segmentIndex) {
          segments.splice(segmentIndex, 1);
        });
        if (!hasExifSegment && exif) {
          segments = [segments[0], exif].concat(segments.slice(1));
        }
        return segments.join("");
      }
      function toHex(str) {
        var hexStr = "";
        for (var i = 0; i < str.length; i++) {
          var h = str.charCodeAt(i);
          var hex = (h < 10 ? "0" : "") + h.toString(16);
          hexStr += hex + " ";
        }
        return hexStr;
      }
      var TYPES = {
        "Byte": 1,
        "Ascii": 2,
        "Short": 3,
        "Long": 4,
        "Rational": 5,
        "Undefined": 7,
        "SLong": 9,
        "SRational": 10
      };
      var TAGS = {
        "Image": {
          11: {
            "name": "ProcessingSoftware",
            "type": "Ascii"
          },
          254: {
            "name": "NewSubfileType",
            "type": "Long"
          },
          255: {
            "name": "SubfileType",
            "type": "Short"
          },
          256: {
            "name": "ImageWidth",
            "type": "Long"
          },
          257: {
            "name": "ImageLength",
            "type": "Long"
          },
          258: {
            "name": "BitsPerSample",
            "type": "Short"
          },
          259: {
            "name": "Compression",
            "type": "Short"
          },
          262: {
            "name": "PhotometricInterpretation",
            "type": "Short"
          },
          263: {
            "name": "Threshholding",
            "type": "Short"
          },
          264: {
            "name": "CellWidth",
            "type": "Short"
          },
          265: {
            "name": "CellLength",
            "type": "Short"
          },
          266: {
            "name": "FillOrder",
            "type": "Short"
          },
          269: {
            "name": "DocumentName",
            "type": "Ascii"
          },
          270: {
            "name": "ImageDescription",
            "type": "Ascii"
          },
          271: {
            "name": "Make",
            "type": "Ascii"
          },
          272: {
            "name": "Model",
            "type": "Ascii"
          },
          273: {
            "name": "StripOffsets",
            "type": "Long"
          },
          274: {
            "name": "Orientation",
            "type": "Short"
          },
          277: {
            "name": "SamplesPerPixel",
            "type": "Short"
          },
          278: {
            "name": "RowsPerStrip",
            "type": "Long"
          },
          279: {
            "name": "StripByteCounts",
            "type": "Long"
          },
          282: {
            "name": "XResolution",
            "type": "Rational"
          },
          283: {
            "name": "YResolution",
            "type": "Rational"
          },
          284: {
            "name": "PlanarConfiguration",
            "type": "Short"
          },
          290: {
            "name": "GrayResponseUnit",
            "type": "Short"
          },
          291: {
            "name": "GrayResponseCurve",
            "type": "Short"
          },
          292: {
            "name": "T4Options",
            "type": "Long"
          },
          293: {
            "name": "T6Options",
            "type": "Long"
          },
          296: {
            "name": "ResolutionUnit",
            "type": "Short"
          },
          301: {
            "name": "TransferFunction",
            "type": "Short"
          },
          305: {
            "name": "Software",
            "type": "Ascii"
          },
          306: {
            "name": "DateTime",
            "type": "Ascii"
          },
          315: {
            "name": "Artist",
            "type": "Ascii"
          },
          316: {
            "name": "HostComputer",
            "type": "Ascii"
          },
          317: {
            "name": "Predictor",
            "type": "Short"
          },
          318: {
            "name": "WhitePoint",
            "type": "Rational"
          },
          319: {
            "name": "PrimaryChromaticities",
            "type": "Rational"
          },
          320: {
            "name": "ColorMap",
            "type": "Short"
          },
          321: {
            "name": "HalftoneHints",
            "type": "Short"
          },
          322: {
            "name": "TileWidth",
            "type": "Short"
          },
          323: {
            "name": "TileLength",
            "type": "Short"
          },
          324: {
            "name": "TileOffsets",
            "type": "Short"
          },
          325: {
            "name": "TileByteCounts",
            "type": "Short"
          },
          330: {
            "name": "SubIFDs",
            "type": "Long"
          },
          332: {
            "name": "InkSet",
            "type": "Short"
          },
          333: {
            "name": "InkNames",
            "type": "Ascii"
          },
          334: {
            "name": "NumberOfInks",
            "type": "Short"
          },
          336: {
            "name": "DotRange",
            "type": "Byte"
          },
          337: {
            "name": "TargetPrinter",
            "type": "Ascii"
          },
          338: {
            "name": "ExtraSamples",
            "type": "Short"
          },
          339: {
            "name": "SampleFormat",
            "type": "Short"
          },
          340: {
            "name": "SMinSampleValue",
            "type": "Short"
          },
          341: {
            "name": "SMaxSampleValue",
            "type": "Short"
          },
          342: {
            "name": "TransferRange",
            "type": "Short"
          },
          343: {
            "name": "ClipPath",
            "type": "Byte"
          },
          344: {
            "name": "XClipPathUnits",
            "type": "Long"
          },
          345: {
            "name": "YClipPathUnits",
            "type": "Long"
          },
          346: {
            "name": "Indexed",
            "type": "Short"
          },
          347: {
            "name": "JPEGTables",
            "type": "Undefined"
          },
          351: {
            "name": "OPIProxy",
            "type": "Short"
          },
          512: {
            "name": "JPEGProc",
            "type": "Long"
          },
          513: {
            "name": "JPEGInterchangeFormat",
            "type": "Long"
          },
          514: {
            "name": "JPEGInterchangeFormatLength",
            "type": "Long"
          },
          515: {
            "name": "JPEGRestartInterval",
            "type": "Short"
          },
          517: {
            "name": "JPEGLosslessPredictors",
            "type": "Short"
          },
          518: {
            "name": "JPEGPointTransforms",
            "type": "Short"
          },
          519: {
            "name": "JPEGQTables",
            "type": "Long"
          },
          520: {
            "name": "JPEGDCTables",
            "type": "Long"
          },
          521: {
            "name": "JPEGACTables",
            "type": "Long"
          },
          529: {
            "name": "YCbCrCoefficients",
            "type": "Rational"
          },
          530: {
            "name": "YCbCrSubSampling",
            "type": "Short"
          },
          531: {
            "name": "YCbCrPositioning",
            "type": "Short"
          },
          532: {
            "name": "ReferenceBlackWhite",
            "type": "Rational"
          },
          700: {
            "name": "XMLPacket",
            "type": "Byte"
          },
          18246: {
            "name": "Rating",
            "type": "Short"
          },
          18249: {
            "name": "RatingPercent",
            "type": "Short"
          },
          32781: {
            "name": "ImageID",
            "type": "Ascii"
          },
          33421: {
            "name": "CFARepeatPatternDim",
            "type": "Short"
          },
          33422: {
            "name": "CFAPattern",
            "type": "Byte"
          },
          33423: {
            "name": "BatteryLevel",
            "type": "Rational"
          },
          33432: {
            "name": "Copyright",
            "type": "Ascii"
          },
          33434: {
            "name": "ExposureTime",
            "type": "Rational"
          },
          34377: {
            "name": "ImageResources",
            "type": "Byte"
          },
          34665: {
            "name": "ExifTag",
            "type": "Long"
          },
          34675: {
            "name": "InterColorProfile",
            "type": "Undefined"
          },
          34853: {
            "name": "GPSTag",
            "type": "Long"
          },
          34857: {
            "name": "Interlace",
            "type": "Short"
          },
          34858: {
            "name": "TimeZoneOffset",
            "type": "Long"
          },
          34859: {
            "name": "SelfTimerMode",
            "type": "Short"
          },
          37387: {
            "name": "FlashEnergy",
            "type": "Rational"
          },
          37388: {
            "name": "SpatialFrequencyResponse",
            "type": "Undefined"
          },
          37389: {
            "name": "Noise",
            "type": "Undefined"
          },
          37390: {
            "name": "FocalPlaneXResolution",
            "type": "Rational"
          },
          37391: {
            "name": "FocalPlaneYResolution",
            "type": "Rational"
          },
          37392: {
            "name": "FocalPlaneResolutionUnit",
            "type": "Short"
          },
          37393: {
            "name": "ImageNumber",
            "type": "Long"
          },
          37394: {
            "name": "SecurityClassification",
            "type": "Ascii"
          },
          37395: {
            "name": "ImageHistory",
            "type": "Ascii"
          },
          37397: {
            "name": "ExposureIndex",
            "type": "Rational"
          },
          37398: {
            "name": "TIFFEPStandardID",
            "type": "Byte"
          },
          37399: {
            "name": "SensingMethod",
            "type": "Short"
          },
          40091: {
            "name": "XPTitle",
            "type": "Byte"
          },
          40092: {
            "name": "XPComment",
            "type": "Byte"
          },
          40093: {
            "name": "XPAuthor",
            "type": "Byte"
          },
          40094: {
            "name": "XPKeywords",
            "type": "Byte"
          },
          40095: {
            "name": "XPSubject",
            "type": "Byte"
          },
          50341: {
            "name": "PrintImageMatching",
            "type": "Undefined"
          },
          50706: {
            "name": "DNGVersion",
            "type": "Byte"
          },
          50707: {
            "name": "DNGBackwardVersion",
            "type": "Byte"
          },
          50708: {
            "name": "UniqueCameraModel",
            "type": "Ascii"
          },
          50709: {
            "name": "LocalizedCameraModel",
            "type": "Byte"
          },
          50710: {
            "name": "CFAPlaneColor",
            "type": "Byte"
          },
          50711: {
            "name": "CFALayout",
            "type": "Short"
          },
          50712: {
            "name": "LinearizationTable",
            "type": "Short"
          },
          50713: {
            "name": "BlackLevelRepeatDim",
            "type": "Short"
          },
          50714: {
            "name": "BlackLevel",
            "type": "Rational"
          },
          50715: {
            "name": "BlackLevelDeltaH",
            "type": "SRational"
          },
          50716: {
            "name": "BlackLevelDeltaV",
            "type": "SRational"
          },
          50717: {
            "name": "WhiteLevel",
            "type": "Short"
          },
          50718: {
            "name": "DefaultScale",
            "type": "Rational"
          },
          50719: {
            "name": "DefaultCropOrigin",
            "type": "Short"
          },
          50720: {
            "name": "DefaultCropSize",
            "type": "Short"
          },
          50721: {
            "name": "ColorMatrix1",
            "type": "SRational"
          },
          50722: {
            "name": "ColorMatrix2",
            "type": "SRational"
          },
          50723: {
            "name": "CameraCalibration1",
            "type": "SRational"
          },
          50724: {
            "name": "CameraCalibration2",
            "type": "SRational"
          },
          50725: {
            "name": "ReductionMatrix1",
            "type": "SRational"
          },
          50726: {
            "name": "ReductionMatrix2",
            "type": "SRational"
          },
          50727: {
            "name": "AnalogBalance",
            "type": "Rational"
          },
          50728: {
            "name": "AsShotNeutral",
            "type": "Short"
          },
          50729: {
            "name": "AsShotWhiteXY",
            "type": "Rational"
          },
          50730: {
            "name": "BaselineExposure",
            "type": "SRational"
          },
          50731: {
            "name": "BaselineNoise",
            "type": "Rational"
          },
          50732: {
            "name": "BaselineSharpness",
            "type": "Rational"
          },
          50733: {
            "name": "BayerGreenSplit",
            "type": "Long"
          },
          50734: {
            "name": "LinearResponseLimit",
            "type": "Rational"
          },
          50735: {
            "name": "CameraSerialNumber",
            "type": "Ascii"
          },
          50736: {
            "name": "LensInfo",
            "type": "Rational"
          },
          50737: {
            "name": "ChromaBlurRadius",
            "type": "Rational"
          },
          50738: {
            "name": "AntiAliasStrength",
            "type": "Rational"
          },
          50739: {
            "name": "ShadowScale",
            "type": "SRational"
          },
          50740: {
            "name": "DNGPrivateData",
            "type": "Byte"
          },
          50741: {
            "name": "MakerNoteSafety",
            "type": "Short"
          },
          50778: {
            "name": "CalibrationIlluminant1",
            "type": "Short"
          },
          50779: {
            "name": "CalibrationIlluminant2",
            "type": "Short"
          },
          50780: {
            "name": "BestQualityScale",
            "type": "Rational"
          },
          50781: {
            "name": "RawDataUniqueID",
            "type": "Byte"
          },
          50827: {
            "name": "OriginalRawFileName",
            "type": "Byte"
          },
          50828: {
            "name": "OriginalRawFileData",
            "type": "Undefined"
          },
          50829: {
            "name": "ActiveArea",
            "type": "Short"
          },
          50830: {
            "name": "MaskedAreas",
            "type": "Short"
          },
          50831: {
            "name": "AsShotICCProfile",
            "type": "Undefined"
          },
          50832: {
            "name": "AsShotPreProfileMatrix",
            "type": "SRational"
          },
          50833: {
            "name": "CurrentICCProfile",
            "type": "Undefined"
          },
          50834: {
            "name": "CurrentPreProfileMatrix",
            "type": "SRational"
          },
          50879: {
            "name": "ColorimetricReference",
            "type": "Short"
          },
          50931: {
            "name": "CameraCalibrationSignature",
            "type": "Byte"
          },
          50932: {
            "name": "ProfileCalibrationSignature",
            "type": "Byte"
          },
          50934: {
            "name": "AsShotProfileName",
            "type": "Byte"
          },
          50935: {
            "name": "NoiseReductionApplied",
            "type": "Rational"
          },
          50936: {
            "name": "ProfileName",
            "type": "Byte"
          },
          50937: {
            "name": "ProfileHueSatMapDims",
            "type": "Long"
          },
          50938: {
            "name": "ProfileHueSatMapData1",
            "type": "Float"
          },
          50939: {
            "name": "ProfileHueSatMapData2",
            "type": "Float"
          },
          50940: {
            "name": "ProfileToneCurve",
            "type": "Float"
          },
          50941: {
            "name": "ProfileEmbedPolicy",
            "type": "Long"
          },
          50942: {
            "name": "ProfileCopyright",
            "type": "Byte"
          },
          50964: {
            "name": "ForwardMatrix1",
            "type": "SRational"
          },
          50965: {
            "name": "ForwardMatrix2",
            "type": "SRational"
          },
          50966: {
            "name": "PreviewApplicationName",
            "type": "Byte"
          },
          50967: {
            "name": "PreviewApplicationVersion",
            "type": "Byte"
          },
          50968: {
            "name": "PreviewSettingsName",
            "type": "Byte"
          },
          50969: {
            "name": "PreviewSettingsDigest",
            "type": "Byte"
          },
          50970: {
            "name": "PreviewColorSpace",
            "type": "Long"
          },
          50971: {
            "name": "PreviewDateTime",
            "type": "Ascii"
          },
          50972: {
            "name": "RawImageDigest",
            "type": "Undefined"
          },
          50973: {
            "name": "OriginalRawFileDigest",
            "type": "Undefined"
          },
          50974: {
            "name": "SubTileBlockSize",
            "type": "Long"
          },
          50975: {
            "name": "RowInterleaveFactor",
            "type": "Long"
          },
          50981: {
            "name": "ProfileLookTableDims",
            "type": "Long"
          },
          50982: {
            "name": "ProfileLookTableData",
            "type": "Float"
          },
          51008: {
            "name": "OpcodeList1",
            "type": "Undefined"
          },
          51009: {
            "name": "OpcodeList2",
            "type": "Undefined"
          },
          51022: {
            "name": "OpcodeList3",
            "type": "Undefined"
          }
        },
        "Exif": {
          33434: {
            "name": "ExposureTime",
            "type": "Rational"
          },
          33437: {
            "name": "FNumber",
            "type": "Rational"
          },
          34850: {
            "name": "ExposureProgram",
            "type": "Short"
          },
          34852: {
            "name": "SpectralSensitivity",
            "type": "Ascii"
          },
          34855: {
            "name": "ISOSpeedRatings",
            "type": "Short"
          },
          34856: {
            "name": "OECF",
            "type": "Undefined"
          },
          34864: {
            "name": "SensitivityType",
            "type": "Short"
          },
          34865: {
            "name": "StandardOutputSensitivity",
            "type": "Long"
          },
          34866: {
            "name": "RecommendedExposureIndex",
            "type": "Long"
          },
          34867: {
            "name": "ISOSpeed",
            "type": "Long"
          },
          34868: {
            "name": "ISOSpeedLatitudeyyy",
            "type": "Long"
          },
          34869: {
            "name": "ISOSpeedLatitudezzz",
            "type": "Long"
          },
          36864: {
            "name": "ExifVersion",
            "type": "Undefined"
          },
          36867: {
            "name": "DateTimeOriginal",
            "type": "Ascii"
          },
          36868: {
            "name": "DateTimeDigitized",
            "type": "Ascii"
          },
          37121: {
            "name": "ComponentsConfiguration",
            "type": "Undefined"
          },
          37122: {
            "name": "CompressedBitsPerPixel",
            "type": "Rational"
          },
          37377: {
            "name": "ShutterSpeedValue",
            "type": "SRational"
          },
          37378: {
            "name": "ApertureValue",
            "type": "Rational"
          },
          37379: {
            "name": "BrightnessValue",
            "type": "SRational"
          },
          37380: {
            "name": "ExposureBiasValue",
            "type": "SRational"
          },
          37381: {
            "name": "MaxApertureValue",
            "type": "Rational"
          },
          37382: {
            "name": "SubjectDistance",
            "type": "Rational"
          },
          37383: {
            "name": "MeteringMode",
            "type": "Short"
          },
          37384: {
            "name": "LightSource",
            "type": "Short"
          },
          37385: {
            "name": "Flash",
            "type": "Short"
          },
          37386: {
            "name": "FocalLength",
            "type": "Rational"
          },
          37396: {
            "name": "SubjectArea",
            "type": "Short"
          },
          37500: {
            "name": "MakerNote",
            "type": "Undefined"
          },
          37510: {
            "name": "UserComment",
            "type": "Ascii"
          },
          37520: {
            "name": "SubSecTime",
            "type": "Ascii"
          },
          37521: {
            "name": "SubSecTimeOriginal",
            "type": "Ascii"
          },
          37522: {
            "name": "SubSecTimeDigitized",
            "type": "Ascii"
          },
          40960: {
            "name": "FlashpixVersion",
            "type": "Undefined"
          },
          40961: {
            "name": "ColorSpace",
            "type": "Short"
          },
          40962: {
            "name": "PixelXDimension",
            "type": "Long"
          },
          40963: {
            "name": "PixelYDimension",
            "type": "Long"
          },
          40964: {
            "name": "RelatedSoundFile",
            "type": "Ascii"
          },
          40965: {
            "name": "InteroperabilityTag",
            "type": "Long"
          },
          41483: {
            "name": "FlashEnergy",
            "type": "Rational"
          },
          41484: {
            "name": "SpatialFrequencyResponse",
            "type": "Undefined"
          },
          41486: {
            "name": "FocalPlaneXResolution",
            "type": "Rational"
          },
          41487: {
            "name": "FocalPlaneYResolution",
            "type": "Rational"
          },
          41488: {
            "name": "FocalPlaneResolutionUnit",
            "type": "Short"
          },
          41492: {
            "name": "SubjectLocation",
            "type": "Short"
          },
          41493: {
            "name": "ExposureIndex",
            "type": "Rational"
          },
          41495: {
            "name": "SensingMethod",
            "type": "Short"
          },
          41728: {
            "name": "FileSource",
            "type": "Undefined"
          },
          41729: {
            "name": "SceneType",
            "type": "Undefined"
          },
          41730: {
            "name": "CFAPattern",
            "type": "Undefined"
          },
          41985: {
            "name": "CustomRendered",
            "type": "Short"
          },
          41986: {
            "name": "ExposureMode",
            "type": "Short"
          },
          41987: {
            "name": "WhiteBalance",
            "type": "Short"
          },
          41988: {
            "name": "DigitalZoomRatio",
            "type": "Rational"
          },
          41989: {
            "name": "FocalLengthIn35mmFilm",
            "type": "Short"
          },
          41990: {
            "name": "SceneCaptureType",
            "type": "Short"
          },
          41991: {
            "name": "GainControl",
            "type": "Short"
          },
          41992: {
            "name": "Contrast",
            "type": "Short"
          },
          41993: {
            "name": "Saturation",
            "type": "Short"
          },
          41994: {
            "name": "Sharpness",
            "type": "Short"
          },
          41995: {
            "name": "DeviceSettingDescription",
            "type": "Undefined"
          },
          41996: {
            "name": "SubjectDistanceRange",
            "type": "Short"
          },
          42016: {
            "name": "ImageUniqueID",
            "type": "Ascii"
          },
          42032: {
            "name": "CameraOwnerName",
            "type": "Ascii"
          },
          42033: {
            "name": "BodySerialNumber",
            "type": "Ascii"
          },
          42034: {
            "name": "LensSpecification",
            "type": "Rational"
          },
          42035: {
            "name": "LensMake",
            "type": "Ascii"
          },
          42036: {
            "name": "LensModel",
            "type": "Ascii"
          },
          42037: {
            "name": "LensSerialNumber",
            "type": "Ascii"
          },
          42240: {
            "name": "Gamma",
            "type": "Rational"
          }
        },
        "GPS": {
          0: {
            "name": "GPSVersionID",
            "type": "Byte"
          },
          1: {
            "name": "GPSLatitudeRef",
            "type": "Ascii"
          },
          2: {
            "name": "GPSLatitude",
            "type": "Rational"
          },
          3: {
            "name": "GPSLongitudeRef",
            "type": "Ascii"
          },
          4: {
            "name": "GPSLongitude",
            "type": "Rational"
          },
          5: {
            "name": "GPSAltitudeRef",
            "type": "Byte"
          },
          6: {
            "name": "GPSAltitude",
            "type": "Rational"
          },
          7: {
            "name": "GPSTimeStamp",
            "type": "Rational"
          },
          8: {
            "name": "GPSSatellites",
            "type": "Ascii"
          },
          9: {
            "name": "GPSStatus",
            "type": "Ascii"
          },
          10: {
            "name": "GPSMeasureMode",
            "type": "Ascii"
          },
          11: {
            "name": "GPSDOP",
            "type": "Rational"
          },
          12: {
            "name": "GPSSpeedRef",
            "type": "Ascii"
          },
          13: {
            "name": "GPSSpeed",
            "type": "Rational"
          },
          14: {
            "name": "GPSTrackRef",
            "type": "Ascii"
          },
          15: {
            "name": "GPSTrack",
            "type": "Rational"
          },
          16: {
            "name": "GPSImgDirectionRef",
            "type": "Ascii"
          },
          17: {
            "name": "GPSImgDirection",
            "type": "Rational"
          },
          18: {
            "name": "GPSMapDatum",
            "type": "Ascii"
          },
          19: {
            "name": "GPSDestLatitudeRef",
            "type": "Ascii"
          },
          20: {
            "name": "GPSDestLatitude",
            "type": "Rational"
          },
          21: {
            "name": "GPSDestLongitudeRef",
            "type": "Ascii"
          },
          22: {
            "name": "GPSDestLongitude",
            "type": "Rational"
          },
          23: {
            "name": "GPSDestBearingRef",
            "type": "Ascii"
          },
          24: {
            "name": "GPSDestBearing",
            "type": "Rational"
          },
          25: {
            "name": "GPSDestDistanceRef",
            "type": "Ascii"
          },
          26: {
            "name": "GPSDestDistance",
            "type": "Rational"
          },
          27: {
            "name": "GPSProcessingMethod",
            "type": "Undefined"
          },
          28: {
            "name": "GPSAreaInformation",
            "type": "Undefined"
          },
          29: {
            "name": "GPSDateStamp",
            "type": "Ascii"
          },
          30: {
            "name": "GPSDifferential",
            "type": "Short"
          },
          31: {
            "name": "GPSHPositioningError",
            "type": "Rational"
          }
        },
        "Interop": {
          1: {
            "name": "InteroperabilityIndex",
            "type": "Ascii"
          }
        }
      };
      TAGS["0th"] = TAGS["Image"];
      TAGS["1st"] = TAGS["Image"];
      that.TAGS = TAGS;
      that.ImageIFD = {
        ProcessingSoftware: 11,
        NewSubfileType: 254,
        SubfileType: 255,
        ImageWidth: 256,
        ImageLength: 257,
        BitsPerSample: 258,
        Compression: 259,
        PhotometricInterpretation: 262,
        Threshholding: 263,
        CellWidth: 264,
        CellLength: 265,
        FillOrder: 266,
        DocumentName: 269,
        ImageDescription: 270,
        Make: 271,
        Model: 272,
        StripOffsets: 273,
        Orientation: 274,
        SamplesPerPixel: 277,
        RowsPerStrip: 278,
        StripByteCounts: 279,
        XResolution: 282,
        YResolution: 283,
        PlanarConfiguration: 284,
        GrayResponseUnit: 290,
        GrayResponseCurve: 291,
        T4Options: 292,
        T6Options: 293,
        ResolutionUnit: 296,
        TransferFunction: 301,
        Software: 305,
        DateTime: 306,
        Artist: 315,
        HostComputer: 316,
        Predictor: 317,
        WhitePoint: 318,
        PrimaryChromaticities: 319,
        ColorMap: 320,
        HalftoneHints: 321,
        TileWidth: 322,
        TileLength: 323,
        TileOffsets: 324,
        TileByteCounts: 325,
        SubIFDs: 330,
        InkSet: 332,
        InkNames: 333,
        NumberOfInks: 334,
        DotRange: 336,
        TargetPrinter: 337,
        ExtraSamples: 338,
        SampleFormat: 339,
        SMinSampleValue: 340,
        SMaxSampleValue: 341,
        TransferRange: 342,
        ClipPath: 343,
        XClipPathUnits: 344,
        YClipPathUnits: 345,
        Indexed: 346,
        JPEGTables: 347,
        OPIProxy: 351,
        JPEGProc: 512,
        JPEGInterchangeFormat: 513,
        JPEGInterchangeFormatLength: 514,
        JPEGRestartInterval: 515,
        JPEGLosslessPredictors: 517,
        JPEGPointTransforms: 518,
        JPEGQTables: 519,
        JPEGDCTables: 520,
        JPEGACTables: 521,
        YCbCrCoefficients: 529,
        YCbCrSubSampling: 530,
        YCbCrPositioning: 531,
        ReferenceBlackWhite: 532,
        XMLPacket: 700,
        Rating: 18246,
        RatingPercent: 18249,
        ImageID: 32781,
        CFARepeatPatternDim: 33421,
        CFAPattern: 33422,
        BatteryLevel: 33423,
        Copyright: 33432,
        ExposureTime: 33434,
        ImageResources: 34377,
        ExifTag: 34665,
        InterColorProfile: 34675,
        GPSTag: 34853,
        Interlace: 34857,
        TimeZoneOffset: 34858,
        SelfTimerMode: 34859,
        FlashEnergy: 37387,
        SpatialFrequencyResponse: 37388,
        Noise: 37389,
        FocalPlaneXResolution: 37390,
        FocalPlaneYResolution: 37391,
        FocalPlaneResolutionUnit: 37392,
        ImageNumber: 37393,
        SecurityClassification: 37394,
        ImageHistory: 37395,
        ExposureIndex: 37397,
        TIFFEPStandardID: 37398,
        SensingMethod: 37399,
        XPTitle: 40091,
        XPComment: 40092,
        XPAuthor: 40093,
        XPKeywords: 40094,
        XPSubject: 40095,
        PrintImageMatching: 50341,
        DNGVersion: 50706,
        DNGBackwardVersion: 50707,
        UniqueCameraModel: 50708,
        LocalizedCameraModel: 50709,
        CFAPlaneColor: 50710,
        CFALayout: 50711,
        LinearizationTable: 50712,
        BlackLevelRepeatDim: 50713,
        BlackLevel: 50714,
        BlackLevelDeltaH: 50715,
        BlackLevelDeltaV: 50716,
        WhiteLevel: 50717,
        DefaultScale: 50718,
        DefaultCropOrigin: 50719,
        DefaultCropSize: 50720,
        ColorMatrix1: 50721,
        ColorMatrix2: 50722,
        CameraCalibration1: 50723,
        CameraCalibration2: 50724,
        ReductionMatrix1: 50725,
        ReductionMatrix2: 50726,
        AnalogBalance: 50727,
        AsShotNeutral: 50728,
        AsShotWhiteXY: 50729,
        BaselineExposure: 50730,
        BaselineNoise: 50731,
        BaselineSharpness: 50732,
        BayerGreenSplit: 50733,
        LinearResponseLimit: 50734,
        CameraSerialNumber: 50735,
        LensInfo: 50736,
        ChromaBlurRadius: 50737,
        AntiAliasStrength: 50738,
        ShadowScale: 50739,
        DNGPrivateData: 50740,
        MakerNoteSafety: 50741,
        CalibrationIlluminant1: 50778,
        CalibrationIlluminant2: 50779,
        BestQualityScale: 50780,
        RawDataUniqueID: 50781,
        OriginalRawFileName: 50827,
        OriginalRawFileData: 50828,
        ActiveArea: 50829,
        MaskedAreas: 50830,
        AsShotICCProfile: 50831,
        AsShotPreProfileMatrix: 50832,
        CurrentICCProfile: 50833,
        CurrentPreProfileMatrix: 50834,
        ColorimetricReference: 50879,
        CameraCalibrationSignature: 50931,
        ProfileCalibrationSignature: 50932,
        AsShotProfileName: 50934,
        NoiseReductionApplied: 50935,
        ProfileName: 50936,
        ProfileHueSatMapDims: 50937,
        ProfileHueSatMapData1: 50938,
        ProfileHueSatMapData2: 50939,
        ProfileToneCurve: 50940,
        ProfileEmbedPolicy: 50941,
        ProfileCopyright: 50942,
        ForwardMatrix1: 50964,
        ForwardMatrix2: 50965,
        PreviewApplicationName: 50966,
        PreviewApplicationVersion: 50967,
        PreviewSettingsName: 50968,
        PreviewSettingsDigest: 50969,
        PreviewColorSpace: 50970,
        PreviewDateTime: 50971,
        RawImageDigest: 50972,
        OriginalRawFileDigest: 50973,
        SubTileBlockSize: 50974,
        RowInterleaveFactor: 50975,
        ProfileLookTableDims: 50981,
        ProfileLookTableData: 50982,
        OpcodeList1: 51008,
        OpcodeList2: 51009,
        OpcodeList3: 51022,
        NoiseProfile: 51041
      };
      that.ExifIFD = {
        ExposureTime: 33434,
        FNumber: 33437,
        ExposureProgram: 34850,
        SpectralSensitivity: 34852,
        ISOSpeedRatings: 34855,
        OECF: 34856,
        SensitivityType: 34864,
        StandardOutputSensitivity: 34865,
        RecommendedExposureIndex: 34866,
        ISOSpeed: 34867,
        ISOSpeedLatitudeyyy: 34868,
        ISOSpeedLatitudezzz: 34869,
        ExifVersion: 36864,
        DateTimeOriginal: 36867,
        DateTimeDigitized: 36868,
        ComponentsConfiguration: 37121,
        CompressedBitsPerPixel: 37122,
        ShutterSpeedValue: 37377,
        ApertureValue: 37378,
        BrightnessValue: 37379,
        ExposureBiasValue: 37380,
        MaxApertureValue: 37381,
        SubjectDistance: 37382,
        MeteringMode: 37383,
        LightSource: 37384,
        Flash: 37385,
        FocalLength: 37386,
        SubjectArea: 37396,
        MakerNote: 37500,
        UserComment: 37510,
        SubSecTime: 37520,
        SubSecTimeOriginal: 37521,
        SubSecTimeDigitized: 37522,
        FlashpixVersion: 40960,
        ColorSpace: 40961,
        PixelXDimension: 40962,
        PixelYDimension: 40963,
        RelatedSoundFile: 40964,
        InteroperabilityTag: 40965,
        FlashEnergy: 41483,
        SpatialFrequencyResponse: 41484,
        FocalPlaneXResolution: 41486,
        FocalPlaneYResolution: 41487,
        FocalPlaneResolutionUnit: 41488,
        SubjectLocation: 41492,
        ExposureIndex: 41493,
        SensingMethod: 41495,
        FileSource: 41728,
        SceneType: 41729,
        CFAPattern: 41730,
        CustomRendered: 41985,
        ExposureMode: 41986,
        WhiteBalance: 41987,
        DigitalZoomRatio: 41988,
        FocalLengthIn35mmFilm: 41989,
        SceneCaptureType: 41990,
        GainControl: 41991,
        Contrast: 41992,
        Saturation: 41993,
        Sharpness: 41994,
        DeviceSettingDescription: 41995,
        SubjectDistanceRange: 41996,
        ImageUniqueID: 42016,
        CameraOwnerName: 42032,
        BodySerialNumber: 42033,
        LensSpecification: 42034,
        LensMake: 42035,
        LensModel: 42036,
        LensSerialNumber: 42037,
        Gamma: 42240
      };
      that.GPSIFD = {
        GPSVersionID: 0,
        GPSLatitudeRef: 1,
        GPSLatitude: 2,
        GPSLongitudeRef: 3,
        GPSLongitude: 4,
        GPSAltitudeRef: 5,
        GPSAltitude: 6,
        GPSTimeStamp: 7,
        GPSSatellites: 8,
        GPSStatus: 9,
        GPSMeasureMode: 10,
        GPSDOP: 11,
        GPSSpeedRef: 12,
        GPSSpeed: 13,
        GPSTrackRef: 14,
        GPSTrack: 15,
        GPSImgDirectionRef: 16,
        GPSImgDirection: 17,
        GPSMapDatum: 18,
        GPSDestLatitudeRef: 19,
        GPSDestLatitude: 20,
        GPSDestLongitudeRef: 21,
        GPSDestLongitude: 22,
        GPSDestBearingRef: 23,
        GPSDestBearing: 24,
        GPSDestDistanceRef: 25,
        GPSDestDistance: 26,
        GPSProcessingMethod: 27,
        GPSAreaInformation: 28,
        GPSDateStamp: 29,
        GPSDifferential: 30,
        GPSHPositioningError: 31
      };
      that.InteropIFD = {
        InteroperabilityIndex: 1
      };
      that.GPSHelper = {
        degToDmsRational: function(degFloat) {
          var degAbs = Math.abs(degFloat);
          var minFloat = degAbs % 1 * 60;
          var secFloat = minFloat % 1 * 60;
          var deg = Math.floor(degAbs);
          var min = Math.floor(minFloat);
          var sec = Math.round(secFloat * 100);
          return [[deg, 1], [min, 1], [sec, 100]];
        },
        dmsRationalToDeg: function(dmsArray, ref) {
          var sign = ref === "S" || ref === "W" ? -1 : 1;
          var deg = dmsArray[0][0] / dmsArray[0][1] + dmsArray[1][0] / dmsArray[1][1] / 60 + dmsArray[2][0] / dmsArray[2][1] / 3600;
          return deg * sign;
        }
      };
      if (typeof exports !== "undefined") {
        if (typeof module2 !== "undefined" && module2.exports) {
          exports = module2.exports = that;
        }
        exports.piexif = that;
      } else {
        window.piexif = that;
      }
    })();
  }
});

// src/client.ts
var client_exports = {};
__export(client_exports, {
  runClient: () => runClient
});
module.exports = __toCommonJS(client_exports);
var import_fs5 = __toESM(require("fs"));

// src/utils/File/Exif.ts
var import_piexifjs = __toESM(require_piexif());
var formatter = new Intl.DateTimeFormat("ko-kr", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
var getFormatParts = (date) => {
  const rawParts = formatter.formatToParts(date);
  return rawParts.reduce((parts, part) => {
    parts[part.type] = part.value;
    return parts;
  }, {});
};
var formatToExifDateTime = (date) => {
  const { year, month, day, hour, minute, second } = getFormatParts(date);
  return `${year}:${month}:${day} ${hour}:${minute}:${second}`;
};
var Exif = class {
  exif = {
    Exif: {}
  };
  jpgBinaryString = "";
  constructor(jpegBinaryString) {
    this.jpgBinaryString = jpegBinaryString;
    this.exif = import_piexifjs.default.load(jpegBinaryString);
  }
  getDateTime() {
    return this.exif.Exif[import_piexifjs.default.ExifIFD.DateTimeOriginal] ?? this.exif.Exif[import_piexifjs.default.ExifIFD.DateTimeDigitized];
  }
  setDateTime(date) {
    const formattedDate = formatToExifDateTime(date);
    this.exif.Exif[import_piexifjs.default.ExifIFD.DateTimeOriginal] = formattedDate;
    this.exif.Exif[import_piexifjs.default.ExifIFD.DateTimeDigitized] = formattedDate;
  }
  getJpegBinary() {
    const exifStr = import_piexifjs.default.dump(this.exif);
    const bin = import_piexifjs.default.remove(this.jpgBinaryString);
    return Buffer.from(import_piexifjs.default.insert(exifStr, bin), "binary");
  }
};

// src/utils/File/File.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var File = class {
  name;
  ext;
  path;
  mediaType;
  size;
  mode;
  birthTime;
  constructor(filePath) {
    const stat = import_fs.default.statSync(filePath);
    const name = filePath.split(import_path.default.sep).pop();
    if (name === void 0) {
      throw new Error(`Cannot found filename of ${filePath}`);
    }
    this.name = name;
    this.ext = import_path.default.extname(this.name).slice(1);
    this.path = filePath;
    this.mediaType = this.mediaTypeOf();
    this.size = stat.size;
    this.mode = stat.mode;
    this.birthTime = new Date(
      Math.min(
        ...[
          stat.birthtime.getTime(),
          stat.atime.getTime(),
          stat.mtime.getTime(),
          stat.ctime.getTime(),
          Date.now()
        ]
      )
    );
  }
  mediaTypeOf() {
    if (this.ext.match(/jpe?g|gif|png|bmp|tiff|webp|rw2/i)) {
      return "image";
    }
    if (this.ext.match(/mp4[pv]?|mp3|webm|avi|wmv|mov/i)) {
      return "video";
    }
    return null;
  }
  read() {
    return import_fs.default.readFileSync(this.path);
  }
  readAsStream() {
    return import_fs.default.createReadStream(this.path);
  }
  readableSize() {
    const SUFFIX_SET = ["B", "KB", "MB", "GB", "TB"];
    let suffix = 0;
    let size = this.size;
    while (size >= 1024) {
      size /= 1024;
      suffix++;
    }
    return `${size.toFixed(2)} ${SUFFIX_SET[suffix]}`;
  }
  delete() {
    import_fs.default.unlinkSync(this.path);
  }
  isJpeg() {
    return /jpe?g/i.test(this.ext);
  }
};

// src/utils/File/FileUtils.ts
var import_fs4 = __toESM(require("fs"));
var import_path4 = __toESM(require("path"));

// src/utils/logger.ts
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));

// src/utils/Properties.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var Properties = class {
  path = "";
  _prop;
  constructor(pathToJson) {
    if (pathToJson === void 0 || pathToJson === null) {
      if (false) {
        throw new Error(`TTP_APP_PROPERTIES_FILE_PATH env value is undefined`);
      }
      this.path = import_path2.default.resolve(
        __dirname,
        "./properties.json"
      );
    } else {
      this.path = pathToJson;
    }
    this.read();
  }
  get value() {
    return this._prop;
  }
  read() {
    const propFile = import_fs2.default.readFileSync(this.path, { encoding: "utf-8" });
    if (!propFile)
      throw "properties.json is empty!";
    const prop = JSON.parse(propFile);
    if (!prop.targets.length)
      throw "There is no target directories for watching";
    prop.LAST_UPDATE = new Date(prop.LAST_UPDATE);
    this._prop = prop;
  }
  write(prop) {
    this._prop = prop;
    import_fs2.default.writeFileSync(this.path, JSON.stringify(prop, null, 4));
  }
};

// src/utils/logger.ts
var { LOG_DIR, LOGGING, ROOT } = new Properties().value;
var BASE = import_path3.default.join(ROOT, LOG_DIR);
var log = {
  info: (obj, isDisplayOnly) => {
    write(`[INFO] ${stringify(obj)}`, isDisplayOnly);
  },
  err: (obj, isDisplayOnly) => {
    write(`[ERROR] ${stringify(obj)}`, isDisplayOnly);
  }
};
function write(str, displayOnly) {
  if (!LOGGING)
    return;
  if (displayOnly) {
    console.log(`${str}`);
    return;
  }
  const { year, month, date } = now();
  const dirPath = import_path3.default.resolve(BASE, `./${year}`);
  if (!import_fs3.default.existsSync(dirPath)) {
    import_fs3.default.mkdirSync(dirPath, { recursive: true });
  }
  import_fs3.default.writeFileSync(
    import_path3.default.resolve(
      dirPath,
      `./${pad(month.toString())}${pad(date.toString())}.log`
    ),
    str + "\n",
    { flag: "a" }
  );
  console.log(str);
}
function pad(v) {
  return v.toString().padStart(2, "0");
}
function now() {
  const date = new Date((/* @__PURE__ */ new Date()).getTime() + 9 * 60 * 60 * 1e3);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    date: date.getUTCDate()
  };
}
function stringify(input) {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input === "object") {
    return JSON.stringify(input, null, 2);
  }
  return String(input);
}

// src/utils/File/FileUtils.ts
function lookupNewFile(dir, ignore, LAST_UPDATE) {
  const result = [];
  const dirs = [dir];
  while (dirs.length) {
    const currentDir = dirs.pop();
    if (currentDir === void 0) {
      throw new Error(`Failed lookup directory: target is undefined`);
    }
    if (ignore.dir(currentDir))
      continue;
    import_fs4.default.readdirSync(currentDir).forEach((name) => {
      const fullPath = import_path4.default.join(currentDir, name);
      const stat = import_fs4.default.statSync(fullPath);
      if (stat.isDirectory()) {
        dirs.push(fullPath);
        return;
      }
      if (LAST_UPDATE > stat.ctime)
        return;
      if (ignore.file(fullPath))
        return;
      result.push(fullPath);
    });
  }
  return result;
}
function getNewFiles(ROOT2, dirs, ignores, LAST_UPDATE) {
  return dirs.map((d) => {
    let newFiles = [];
    try {
      newFiles = lookupNewFile(import_path4.default.join(ROOT2, d), ignores, LAST_UPDATE);
    } catch (e) {
      log.err("Failed while lookup new file " + e);
    }
    return newFiles;
  }).flat();
}
function createFile(fullPath, data) {
  import_fs4.default.writeFileSync(fullPath, data);
}

// src/utils/File/Ignores/utils.ts
function isDirectory(path5) {
  return path5.slice(-1) === "/";
}
function convertSeparator(path5) {
  return path5.replace(/\\/g, "/");
}
var escapeRegExp = (part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var singleAsterisk = (part) => part.replace(/^\*$/, "[^/]+");
var doubleAsterisk = (part) => part.replace(/^\*{2}$/, "([^/]+/?)+");
var asteriskInText = (part) => part.replace(
  /([^*]*)\*([^*]+)|([^*]+)\*([^*]*)/,
  (_, group1, group2, group3, group4) => escapeRegExp(group1 ?? group3) + "[^/]*" + escapeRegExp(group2 ?? group4)
);
function escape(part) {
  const escapeSingleAsterisk = singleAsterisk(part);
  if (escapeSingleAsterisk !== part) {
    return escapeSingleAsterisk;
  }
  const escapeDoubleAsterisk = doubleAsterisk(part);
  if (escapeDoubleAsterisk !== part) {
    return escapeDoubleAsterisk;
  }
  const escapeAsteriskInText = asteriskInText(part);
  if (escapeAsteriskInText !== part) {
    return escapeAsteriskInText;
  }
  return escapeRegExp(part);
}

// src/utils/File/Ignores/index.ts
var Ignores = class {
  ROOT;
  pathes;
  dirPathes;
  filePathes;
  constructor(pathes, ROOT2 = "") {
    ROOT2 = convertSeparator(ROOT2);
    this.ROOT = isDirectory(ROOT2) ? ROOT2.slice(0, -1) : ROOT2;
    this.pathes = pathes.map(convertSeparator);
    this.dirPathes = this.parse(pathes.filter(isDirectory));
    this.filePathes = this.parse(pathes.filter((p) => !isDirectory(p)));
  }
  dir(path5) {
    path5 = convertSeparator(path5);
    if (!isDirectory(path5)) {
      path5 += "/";
    }
    return this.dirPathes.some((ignore) => ignore.test(path5));
  }
  file(path5) {
    path5 = convertSeparator(path5);
    return this.filePathes.some((ignore) => ignore.test(path5));
  }
  parse(pathes) {
    const root = escape(this.ROOT);
    return pathes.map((path5) => {
      const parts = path5.split("/");
      const isStartFromRoot = parts[0] === "";
      parts[0] = isStartFromRoot ? "^" + root : parts.length === 1 ? parts[0] : escape(parts[0]);
      const lastPart = parts[parts.length - 1];
      const isFile = lastPart !== "";
      if (isFile) {
        parts[parts.length - 1] = escape(lastPart) + "$";
      }
      for (let i = 1; i < parts.length - 1; i++) {
        parts[i] = escape(parts[i]);
      }
      return new RegExp(parts.join("/"), "i");
    });
  }
};

// src/utils/request.ts
var import_http = __toESM(require("http"));

// src/utils/PromisePool.ts
var PromisePool = class {
  limit = 0;
  onBoardSize = 0;
  pool = [];
  constructor(limit) {
    this.limit = limit;
    this.onBoardSize = 0;
    this.pool = [];
  }
  push(producer, size) {
    const { pool, onBoardSize, limit } = this;
    const producerInfo = {
      producer,
      size,
      resolve: () => {
      },
      reject: () => {
      }
    };
    const promise = new Promise((resolve, reject) => {
      producerInfo.resolve = resolve;
      producerInfo.reject = reject;
    });
    if (onBoardSize < limit) {
      this.consume(producerInfo);
    } else {
      pool.push(producerInfo);
    }
    return promise;
  }
  consume(producerInfo) {
    this.onBoardSize += producerInfo.size;
    producerInfo.producer().then(producerInfo.resolve).catch(producerInfo.reject).finally(() => {
      this.onBoardSize -= producerInfo.size;
      if (!this.pool.length && !this.onBoardSize) {
      } else {
        this.next();
      }
    });
  }
  next() {
    const { pool, limit } = this;
    while (pool.length && this.onBoardSize < limit) {
      const producerInfo = pool.shift();
      if (producerInfo)
        this.consume(producerInfo);
    }
  }
};

// src/utils/request.ts
var TIMEOUT_MS = 1e3 * 60 * 5;
var MAX_POOL_SIZE_BYTE = 300 * 1024 * 1024;
var promisePool = new PromisePool(MAX_POOL_SIZE_BYTE);
async function send(file, fetcher) {
  const headers = {
    "Content-Type": `${file.mediaType}/${file.ext}`,
    "Content-Disposition": `attachment; filename="${encodeURI(file.name)}"`,
    "Content-Length": file.size
  };
  const _send = () => {
    log.info(`Sending file: ${file.name}`, true);
    return fetcher(headers, file.readAsStream());
  };
  return promisePool.push(_send, file.size).catch((code) => {
    throw `Upload "${file.name}", ${file.readableSize()}, but got an : ${code}`;
  });
}
function createRequestFunction(hostname, port) {
  return function request(headers, content) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject("Timedout"), TIMEOUT_MS);
      const req = import_http.default.request(
        {
          hostname,
          port,
          headers,
          method: "POST"
        },
        (res) => {
          res.on("error", (e) => log.err(`Response error? ${e}`));
          res.on("data", () => {
          });
          res.on("end", () => {
            clearTimeout(timeoutId);
            if (res.statusCode === void 0 || res.statusCode !== 200) {
              reject(res.statusCode);
              return;
            }
            resolve(res.statusCode);
          });
        }
      );
      req.on("error", (e) => {
        clearTimeout(timeoutId);
        reject(e);
      });
      content.on("open", () => {
        content.pipe(req);
      });
      content.on("error", (err) => {
        log.err("Error during file streaming" + err);
        req.destroy();
      });
      content.on("end", () => {
        req.end();
      });
    });
  };
}

// src/client.ts
if ("true") {
  runClient();
}
async function runClient() {
  log.info(/* @__PURE__ */ new Date());
  const prop = new Properties();
  const {
    LAST_UPDATE,
    ROOT: ROOT2,
    SERVER,
    PORT,
    DELETE_AFTER_UPLOAD,
    targets,
    ignores: ignorePaths
  } = prop.value;
  const request = createRequestFunction(SERVER, PORT);
  const ignores = new Ignores(ignorePaths, ROOT2);
  const results = await Promise.all(
    getNewFiles(ROOT2, targets, ignores, LAST_UPDATE).map(async (d) => {
      await 0;
      const file = new File(d);
      if (!file.mediaType) {
        log.err(`Not supported file type of ${d}`);
        return null;
      }
      let clonedFile = null;
      try {
        if (file.isJpeg() && !hasTimestamp(file)) {
          clonedFile = rewriteTimestamp(file);
        }
      } catch (e) {
        log.err(
          `Failed to check exif timestamp while ${file.path}
	err: ${e}`
        );
      }
      return send(file, request).then((responseCode) => {
        if (DELETE_AFTER_UPLOAD) {
          file.delete();
        }
        log.info(`Upload is done "${d}"`, true);
        return responseCode;
      }).catch((e_1) => {
        log.err(`Failed send file: ${d}, because ${e_1}`);
        return file;
      }).finally(() => {
        clonedFile?.delete();
      });
    })
  );
  const faileds = results.filter((v) => v !== 200);
  log.info(`Tried ${results.length} files, failed ${faileds.length} files.`);
  faileds.filter((v_1) => v_1 !== null).map(({ path: path5, mode }) => {
    import_fs5.default.chmodSync(path5, mode);
  });
  prop.write({
    ...prop.value,
    LAST_UPDATE: /* @__PURE__ */ new Date()
  });
  if (faileds.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
function hasTimestamp(file) {
  const exif = new Exif(file.read().toString("binary"));
  return exif.getDateTime() !== void 0;
}
function rewriteTimestamp(file) {
  try {
    const exif = new Exif(file.read().toString("binary"));
    exif.setDateTime(file.birthTime);
    const MODIFIED_PATH = file.path.replace(file.name, `__${file.name}`);
    createFile(MODIFIED_PATH, exif.getJpegBinary());
    const copiedFile = new File(MODIFIED_PATH);
    log.info(`		Rewrite dateTime EXIF to ${file.name}`);
    return copiedFile;
  } catch (e) {
    log.err(`Failed to modify exif at ${file.path}
	err: ${e}`);
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runClient
});
