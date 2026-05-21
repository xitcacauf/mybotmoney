const config = require("../config/config");

function isOwner(userId) {
  return userId === config.ownerId;
}

function isAdmin(member) {
  if (isOwner(member.id)) return true;
  if (member.permissions.has("Administrator")) return true;
  if (config.adminRoles.length > 0) {
    return member.roles.cache.some((r) => config.adminRoles.includes(r.id));
  }
  return false;
}

function isStaff(member) {
  if (isAdmin(member)) return true;
  if (config.staffRoles.length > 0) {
    return member.roles.cache.some((r) => config.staffRoles.includes(r.id));
  }
  return (
    member.permissions.has("ManageMessages") ||
    member.permissions.has("KickMembers") ||
    member.permissions.has("BanMembers")
  );
}

function hasRole(member, roleId) {
  return member.roles.cache.has(roleId);
}

function checkPermission(message, level) {
  switch (level) {
    case "owner":
      return isOwner(message.author.id);
    case "admin":
      return isAdmin(message.member);
    case "staff":
      return isStaff(message.member);
    default:
      return true;
  }
}

module.exports = { isOwner, isAdmin, isStaff, hasRole, checkPermission };
