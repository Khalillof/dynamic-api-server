
module.exports = Object.assign(
    {},
    require('./lib/auth.service'),
    require('./lib/mongoose.service'),
    require('./lib/seed.database')
)