import {
  assertEquals,
  assertFalse,
  assertTrue,
  fail,
  when,
} from "../test.utils.ts";
import { err, ok } from "./result.ts";

when("Result", ({ when, test }) => {
  when("isOk", ({ test }) => {
    test("with an Ok returns true", () => {
      const x = ok<number, string>(-1);
      assertTrue(x.isOk());
    });

    test("with an Err returns false", () => {
      const x = err<number, string>("this is an error");
      assertFalse(x.isOk());
    });
  });

  when("isErr", ({ test }) => {
    test("with an Ok returns false", () => {
      const x = ok<number, string>(-1);
      assertFalse(x.isErr());
    });

    test("with an Err returns true", () => {
      const x = err<number, string>("this is an error");
      assertTrue(x.isErr());
    });
  });

  when("contains", ({ test }) => {
    test("with Ok given the same value returns true", () => {
      const x = ok(2);
      assertTrue(x.contains(2));
    });

    test("with Ok given a different value returns false", () => {
      const x = ok(3);
      assertFalse(x.contains(2));
    });

    test("with Err returns false", () => {
      const x = err<number, string>("Some error message");
      assertFalse(x.contains(2));
    });
  });

  when("containsErr", ({ test }) => {
    test("with Ok return false", () => {
      const x = ok<number, string>(2);
      assertFalse(x.containsErr("Some error message"));
    });

    test("with Err given the same message returns true", () => {
      const x = err("Some error message");
      assertTrue(x.containsErr("Some error message"));
    });

    test("with Err given an different message returns false", () => {
      const x = err("Some error message");
      assertFalse(x.containsErr("Some other error message"));
    });
  });

  when("ok", ({ test }) => {
    test("with Ok return a Some with the Ok value", () => {
      const x = ok(2);
      assertEquals(x.ok().unwrap(), 2);
    });

    test("with Err return a None", () => {
      const x = err("nothing here");
      assertTrue(x.ok().isNone());
    });
  });

  when("err", ({ test }) => {
    test("with Ok return a None", () => {
      const x = ok(2);
      assertTrue(x.err().isNone());
    });

    test("with Err return a Some with the error value", () => {
      const x = err("nothing here");
      assertEquals(x.err().unwrap(), "nothing here");
    });
  });

  when("map", ({ test }) => {
    test("with Ok allows to change the value", () => {
      const x = ok(2);

      assertTrue(x.map((v: number) => v * 2).contains(4));
    });

    test("with Err does not change the error value", () => {
      const x = err<number, number>(2);

      assertTrue(x.map((v: number) => v + 2).containsErr(2));
    });
  });

  when("mapOr", ({ test }) => {
    test("with Ok execute the given functions", () => {
      const x = ok("foo");
      assertEquals(x.mapOr(42, (v) => v.length), 3);
    });

    test("with Err return the default", () => {
      const x = err<string, string>("bar");
      assertEquals(x.mapOr(42, (v) => v.length), 42);
    });
  });

  when("mapOrElse", ({ test }) => {
    const k = 21;

    test("with Ok execute second functions", () => {
      const x = ok<string, string>("foo");
      assertEquals(x.mapOrElse((e) => k * 2, (v) => v.length), 3);
    });

    test("with Err execute first functions", () => {
      const x = err<string, string>("foo");
      assertEquals(x.mapOrElse((e) => k * 2, (v) => v.length), 42);
    });
  });

  when("mapErr", ({ test }) => {
    const stringify = (x: number) => `error code: ${x}`;

    test("with Ok do nothing", () => {
      const x = ok<number, number>(2);
      assertTrue(x.mapErr(stringify).contains(2));
    });

    test("with Err execute function", () => {
      const x = err<number, number>(13);
      assertTrue(x.mapErr(stringify).containsErr("error code: 13"));
    });
  });

  when("and", ({ test }) => {
    test("with Ok given Err returns Err", () => {
      const x = ok(2);
      const y = err("late error");
      assertTrue(x.and(y).containsErr("late error"));
    });

    test("with Err given Ok return Err", () => {
      const x = err<string, string>("early error");
      const y = ok<string, string>("foo");

      assertTrue(x.and(y).containsErr("early error"));
    });

    test("with Err given Err return first Err", () => {
      const x = err("not a 2");
      const y = ok<string, string>("late error");

      assertTrue(x.and(y).containsErr("not a 2"));
    });

    test("with Ok given Ok return second Ok", () => {
      const x = ok(2);
      const y = ok("other value");

      assertTrue(x.and(y).contains("other value"));
    });
  });

  test("andThen", () => {
    const sq = (x: number) => ok<number, number>(x * x);
    const error = (x: number) => err<number, number>(x);

    assertTrue(ok(2).andThen(sq).andThen(sq).contains(16));
    assertTrue(ok(2).andThen(sq).andThen(error).containsErr(4));
    assertTrue(ok(2).andThen(error).andThen(sq).containsErr(2));
    assertTrue(err<number, number>(3).andThen(sq).andThen(sq).containsErr(3));
  });

  when("or", ({ test }) => {
    test("with Ok given Err returns Ok", () => {
      const x = ok<number, string>(2);
      const y = err<number, string>("late error");
      assertTrue(x.or(y).contains(2));
    });

    test("with Err given Ok return Ok", () => {
      const x = err<string, string>("early error");
      const y = ok<string, string>("foo");

      assertTrue(x.or(y).contains("foo"));
    });

    test("with Err given Err return second Err", () => {
      const x = err("not a 2");
      const y = err<string, string>("late error");

      assertTrue(x.or(y).containsErr("late error"));
    });

    test("with Ok given Ok return first Ok", () => {
      const x = ok<number, string>(2);
      const y = ok<number, string>(100);

      assertTrue(x.or(y).contains(2));
    });
  });

  test("orElse", () => {
    const sq = (x: number) => ok<number, number>(x * x);
    const error = (x: number) => err<number, number>(x);

    assertTrue(ok<number, number>(2).orElse(sq).orElse(sq).contains(2));
    assertTrue(ok<number, number>(2).orElse(error).orElse(sq).contains(2));
    assertTrue(err<number, number>(3).orElse(sq).orElse(error).contains(9));
    assertTrue(
      err<number, number>(3).orElse(error).orElse(error).containsErr(3),
    );
  });

  when("unwrapOr", ({ test }) => {
    test("with Ok returns the value", () => {
      const x = ok(9);
      assertEquals(x.unwrapOr(2), 9);
    });

    test("with Err returns the given value", () => {
      const x = err(9);
      assertEquals(x.unwrapOr(2), 2);
    });
  });

  when("unwrapElse", ({ test }) => {
    const count = (x: string) => x.length;

    test("with Ok returns the value", () => {
      const x = ok<number, string>(2);
      assertEquals(x.unwrapOrElse(count), 2);
    });

    test("with Err returns the given value", () => {
      const x = err<number, string>("foo");
      assertEquals(x.unwrapOrElse(count), 3);
    });
  });

  when("expect", ({ test }) => {
    test("with Ok returns the contained value", () => {
      const x = ok(40);
      assertEquals(x.expect("should have an value"), 40);
    });

    test("with Err panics with the message", () => {
      const x = err("emergency failure");

      try {
        x.expect("Testing expect");
        fail("this should fail");
      } catch (e) {
        assertEquals(
          e.message,
          "panics with `Testing expect: emergency failure`",
        );
      }
    });
  });

  when("unwrap", ({ test }) => {
    test("with Ok returns the contained value", () => {
      const x = ok(2);
      assertEquals(x.unwrap(), 2);
    });

    test("with Err panics with the contained error", () => {
      const x = err("emergency failure");

      try {
        x.unwrap();
        fail("this must fail");
      } catch (e) {
        assertEquals(e.message, "panics with `emergency failure`");
      }
    });
  });

  when("expectErr", ({ test }) => {
    test("with Ok panics with the given message", () => {
      const x = ok(10);

      try {
        x.expectErr("Testing expect_err");
        fail("this must fail");
      } catch (e) {
        assertEquals(e.message, "panics with `Testing expect_err: 10`");
      }
    });

    test("with Err returns the contained error", () => {
      const x = err("emergency failure");
      assertEquals(x.expectErr("Testing expect_err"), "emergency failure");
    });
  });

  when("unwrapErr", ({ test }) => {
    test("with Ok panics with the contained error", () => {
      const x = ok(2);

      try {
        x.unwrapErr();
        fail("this must fail");
      } catch (e) {
        assertEquals(e.message, "panics with `2`");
      }
    });
  });

  test("with Err returns the contained value", () => {
    const x = err("emergency failure");
    assertEquals(x.unwrapErr(), "emergency failure");
  });
});
