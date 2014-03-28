var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

var ConvertedNumber = Match.Where(function (x) {
	check(x, String);
	return parseInt(x) !== NaN;
});